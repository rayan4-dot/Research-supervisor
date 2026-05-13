-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Create a table for academic documents/theses
CREATE TABLE public.academic_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    authors TEXT,
    field TEXT, -- e.g., 'CS', 'Humanities'
    university TEXT,
    year INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create a table for document chunks with embeddings
CREATE TABLE public.document_chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES public.academic_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(768), -- Gemini text-embedding models output 768 dimensions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create a vector similarity search function (RPC)
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- 4. Set up basic RLS
ALTER TABLE public.academic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read to academic_documents" ON public.academic_documents FOR SELECT USING (true);
CREATE POLICY "Allow public read to document_chunks" ON public.document_chunks FOR SELECT USING (true);
-- In production, restrict inserts to admins/system
CREATE POLICY "Allow public insert to academic_documents" ON public.academic_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to document_chunks" ON public.document_chunks FOR INSERT WITH CHECK (true);
