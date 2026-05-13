-- 1. Create Projects Table
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Will be linked to auth.users later
    title TEXT NOT NULL,
    research_topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Research Outputs Table
CREATE TABLE public.research_outputs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('idea', 'structure', 'methodology', 'review')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS) but allow anonymous access for MVP
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_outputs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies to allow public access (since Auth isn't fully wired yet)
CREATE POLICY "Allow public read/write to projects" 
    ON public.projects FOR ALL 
    USING (true) 
    WITH CHECK (true);

CREATE POLICY "Allow public read/write to research_outputs" 
    ON public.research_outputs FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 5. Lightweight Telemetry (Analytics)
CREATE TABLE public.event_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.projects(user_id) ON DELETE SET NULL, -- optional
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- optional
    event_type TEXT NOT NULL, -- e.g., 'VALIDATION_FAIL', 'GENERATION_SUCCESS', 'AI_RETRY'
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert to event_logs" 
    ON public.event_logs FOR INSERT 
    WITH CHECK (true);
