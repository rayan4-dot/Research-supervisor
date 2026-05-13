-- Create the event_logs table for reasoning analytics and RAG monitoring
CREATE TABLE IF NOT EXISTS public.event_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    project_id UUID, -- Optional: link to a project
    user_id UUID,    -- Optional: link to a user
    details JSONB DEFAULT '{}'::jsonb, -- Store dynamic data like citation counts, similarity scores, or error messages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for security (only admins should read, but anyone can write via the service role if needed)
-- For now, we'll allow anonymous inserts for the prototype telemetry
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to event_logs" ON public.event_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read from event_logs" ON public.event_logs
    FOR SELECT USING (true); -- In production, restrict this to admins
