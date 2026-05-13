import { NextResponse } from 'next/server';
import { PromptEngine } from '@/core/prompts';
import { AIService } from '@/services/ai_service';
import type { ResearchContext } from '@/core/prompts';

export async function POST(req: Request) {
  try {
    const { text, context } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const ctx: ResearchContext = context || {};
    const prompt = PromptEngine.buildReviewPrompt(text, ctx);
    const result = await AIService.generate(prompt);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error reviewing text:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
