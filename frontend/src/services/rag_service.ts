import { supabase } from '@/lib/supabase';
import { AIService } from './ai_service';

export interface RAGDocument {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
  doc_title?: string;
  doc_authors?: string;
  doc_field?: string;
}

export class RagService {
  /**
   * Searches the vector database for academic literature matching the query.
   * @param query The user's research topic or specific methodological question
   * @param field Optional academic field to prevent context pollution
   * @param limit Number of chunks to retrieve (default: 3)
   * @param threshold Similarity threshold (default: 0.5)
   * @returns Array of matching document chunks
   */
  static async searchLiterature(query: string, field?: string, limit: number = 3, threshold: number = 0.5): Promise<RAGDocument[]> {
    try {
      // 1. Generate embedding for the user's query
      const queryEmbedding = await AIService.generateEmbedding(query);

      // 2. Perform vector similarity search via Supabase RPC with field filtering
      const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit,
        filter_field: field || null
      });

      if (error) {
        console.error('Vector search failed:', error.message);
        return [];
      }

      return data as RAGDocument[];
    } catch (error) {
      console.error('RAG Retrieval Error:', error);
      return [];
    }
  }

  /**
   * Formats RAG documents into a strict string block for prompt injection.
   */
  static formatForPrompt(documents: RAGDocument[]): string {
    if (!documents || documents.length === 0) return 'No external literature context available.';

    return documents
      .map((doc, idx) => {
        const citation = doc.doc_title ? `[Citation ${idx + 1}: ${doc.doc_title} by ${doc.doc_authors || 'Unknown'}]` : `[Source ${idx + 1}]`;
        return `${citation}\n"${doc.content}"`;
      })
      .join('\n\n');
  }
}
