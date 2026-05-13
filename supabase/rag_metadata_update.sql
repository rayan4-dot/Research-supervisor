-- Drop the previous function since we are changing the return signature
DROP FUNCTION IF EXISTS match_document_chunks;

-- Create an upgraded vector search function that:
-- 1. Joins with academic_documents to return Title, Authors, and Field for citation tracking.
-- 2. Accepts an optional 'filter_field' to prevent Context Pollution (e.g., CS papers appearing in Humanities research).
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(768), -- fallback to 768 since we reverted to gemini-embedding-001
  match_threshold float,
  match_count int,
  filter_field text DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity float,
  doc_title TEXT,
  doc_authors TEXT,
  doc_field TEXT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    ad.title AS doc_title,
    ad.authors AS doc_authors,
    ad.field AS doc_field
  FROM document_chunks dc
  JOIN academic_documents ad ON dc.document_id = ad.id
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_field IS NULL OR ad.field = filter_field)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
