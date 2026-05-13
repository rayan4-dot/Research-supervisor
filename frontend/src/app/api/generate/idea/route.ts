import { NextResponse } from 'next/server';
import { PromptEngine } from '@/core/prompts';
import { AIService } from '@/services/ai_service';
import { RagService } from '@/services/rag_service';
import { TelemetryService } from '@/services/telemetry';
import type { ResearchContext, AcademicField } from '@/core/prompts';

export async function POST(req: Request) {
  try {
    const { topic, field, context } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const ragDocs = await RagService.searchLiterature(topic, field);
    
    // Log telemetry for RAG monitoring
    await TelemetryService.log({
      event_type: 'RAG_RETRIEVAL',
      details: {
        topic,
        field,
        matches_found: ragDocs.length,
        top_similarity: ragDocs[0]?.similarity || 0,
        citations: ragDocs.map(d => d.doc_title)
      }
    });

    const ragContext = RagService.formatForPrompt(ragDocs);

    const ctx: ResearchContext = { ...context, field, ragContext };
    const prompt = PromptEngine.buildIdeaPrompt(topic, ctx);
    const result = await AIService.generate(prompt);

    const _citations = ragDocs.map(d => ({ title: d.doc_title, authors: d.doc_authors, similarity: d.similarity }));

    return NextResponse.json({ ...result, _citations });
  } catch (error: any) {
    console.error('Error generating idea:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
