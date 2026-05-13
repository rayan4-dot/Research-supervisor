// Centralized API service layer — all frontend API calls go through here
import type { IdeaOutput, StructureOutput, MethodologyOutput, ReviewOutput } from '@/models';
import type { ResearchContext, AcademicField, ResearchType } from '@/core/prompts';

export const apiService = {
  generate: {
    async idea(topic: string, field?: AcademicField, context?: ResearchContext): Promise<IdeaOutput> {
      const res = await fetch('/api/generate/idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, field, context }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate idea');
      return res.json();
    },

    async structure(topic: string, field: AcademicField, context?: ResearchContext): Promise<StructureOutput> {
      const res = await fetch('/api/generate/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, field, context }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate structure');
      return res.json();
    },

    async methodology(topic: string, research_type: ResearchType, field?: AcademicField, context?: ResearchContext): Promise<MethodologyOutput> {
      const res = await fetch('/api/generate/methodology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, research_type, field, context }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to generate methodology');
      return res.json();
    },
  },

  review: {
    async text(text: string, context?: ResearchContext): Promise<ReviewOutput> {
      const res = await fetch('/api/review/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to review text');
      return res.json();
    },
  },
};
