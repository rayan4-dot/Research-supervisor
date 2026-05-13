import { NextResponse } from 'next/server';
import { PromptEngine } from '@/core/prompts';
import { AIService } from '@/services/ai_service';
import { RagService } from '@/services/rag_service';
import type { ResearchContext, AcademicField } from '@/core/prompts';

export async function POST(req: Request) {
  try {
    const { topic, field, context } = await req.json();

    if (!topic || !field) {
      return NextResponse.json({ error: 'Topic and field are required' }, { status: 400 });
    }

    const ragDocs = await RagService.searchLiterature(`Thesis structure for ${field} on: ${topic}`, field);
    const ragContext = RagService.formatForPrompt(ragDocs);

    const ctx: ResearchContext = { ...context, field, ragContext };
    const prompt = PromptEngine.buildStructurePrompt(topic, field, ctx);
    const result = await AIService.generate(prompt);

    const _citations = ragDocs.map(d => ({ title: d.doc_title, authors: d.doc_authors, similarity: d.similarity }));

    return NextResponse.json({ ...result, _citations });
  } catch (error: any) {
    console.error('Error generating structure:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
