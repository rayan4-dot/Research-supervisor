import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { AIService } from '@/services/ai_service';

// Basic chunking utility for text
function chunkText(text: string, maxTokens: number = 500): string[] {
  // A rough approximation: split by double newlines (paragraphs), 
  // then group them until they reach the approximate length limit.
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    // Approx 4 chars per token
    if (currentChunk.length + para.length > maxTokens * 4) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { title, authors, field, text } = await req.json();

    if (!title || !text) {
      return NextResponse.json({ error: 'Title and text are required' }, { status: 400 });
    }

    // 1. Create the parent document record
    const { data: docData, error: docError } = await supabase
      .from('academic_documents')
      .insert([{ title, authors, field }])
      .select('id')
      .single();

    if (docError) throw docError;
    const documentId = docData.id;

    // 2. Chunk the document text
    const chunks = chunkText(text);
    console.log(`Split document into ${chunks.length} chunks.`);

    // 3. Process and embed each chunk sequentially to avoid rate limits
    const dbChunks = [];
    const errors = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = chunks[i];
      try {
        const embedding = await AIService.generateEmbedding(chunkContent);
        dbChunks.push({
          document_id: documentId,
          content: chunkContent,
          embedding,
        });
        
        await new Promise(r => setTimeout(r, 500));
      } catch (e: any) {
        console.error(`Failed to embed chunk ${i}:`, e.message);
        errors.push(e.message);
      }
    }

    // 4. Insert all successfully embedded chunks into the vector database
    if (dbChunks.length > 0) {
      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert(dbChunks);
      if (chunkError) throw chunkError;
    }

    return NextResponse.json({ 
      success: true, 
      document_id: documentId,
      chunks_embedded: dbChunks.length,
      errors
    });

  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
