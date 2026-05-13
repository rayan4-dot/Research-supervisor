// TypeScript models matching the Supabase DB schema and strict AI output contracts

export type ProjectStatus = 'draft' | 'in_progress' | 'completed';
export type OutputType = 'idea' | 'structure' | 'methodology' | 'review';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  research_topic: string;
  status: ProjectStatus;
  created_at: string;
}

export interface ResearchOutput {
  id: string;
  project_id: string;
  type: OutputType;
  content: Record<string, any>;
  created_at: string;
}

// ─────────────────────────────────────────────
// ─────────────────────────────────────────────

export interface RAGCitation {
  title?: string;
  authors?: string;
  similarity?: number;
}

export interface IdeaOutput {
  title: string;
  problem_statement: string;
  research_questions: string[];
  hypotheses: string[];
  scope: string;
  academic_level: string;
  literature_grounding?: string;
  _citations?: RAGCitation[];
}

export interface StructureChapter {
  number: number;
  title: string;
  rationale: string;
  subsections: string[];
}

export interface StructureOutput {
  chapters: StructureChapter[];
  literature_grounding?: string;
  _citations?: RAGCitation[];
}

export interface MethodologyOutput {
  method_suggestion: string;
  justification: string;
  data_collection_methods: string[];
  tools: string[];
  sample_strategy: string;
  ethical_considerations: string;
  validity_approach: string;
  literature_grounding?: string;
  _citations?: RAGCitation[];
}

export type QualityRating = 'poor' | 'acceptable' | 'good' | 'excellent';

export interface ReviewOutput {
  overall_quality: QualityRating;
  academic_score: string;
  strengths: string[];
  weaknesses: string[];
  missing_elements: string[];
  improvements: string[];
  supervisor_verdict: string;
}
