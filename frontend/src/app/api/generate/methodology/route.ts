import { NextResponse } from 'next/server';
import { PromptEngine } from '@/core/prompts';
import { AIService } from '@/services/ai_service';
import { RagService } from '@/services/rag_service';
import type { ResearchContext, ResearchType, AcademicField } from '@/core/prompts';

export async function POST(req: Request) {
  try {
    const { topic, research_type, field, context } = await req.json();

    if (!topic || !research_type) {
      return NextResponse.json({ error: 'Topic and research type are required' }, { status: 400 });
    }

    const ragDocs = await RagService.searchLiterature(`Methodology for ${research_type} research on: ${topic}`, field);
    const ragContext = RagService.formatForPrompt(ragDocs);

    const ctx: ResearchContext = { ...context, field, researchType: research_type, ragContext };
    const prompt = PromptEngine.buildMethodologyPrompt(topic, research_type as ResearchType, field as AcademicField, ctx);
    const result = await AIService.generate(prompt);

    const _citations = ragDocs.map(d => ({ title: d.doc_title, authors: d.doc_authors, similarity: d.similarity }));

    return NextResponse.json({ ...result, _citations });
  } catch (error: any) {
    console.error('Error generating methodology:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
