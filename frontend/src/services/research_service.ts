/**
 * ResearchService — Research State Memory
 *
 * Assembles the full project context from all stored research_outputs.
 * This is passed into every AI prompt so the AI is context-aware, not stateless.
 */
import { supabase } from '@/lib/supabase';
import type { ResearchContext } from '@/core/prompts';

export class ResearchService {
  /**
   * Loads all previous AI outputs for a project and assembles
   * them into a ResearchContext object for prompt injection.
   */
  static async assembleContext(projectId: string): Promise<ResearchContext> {
    const { data: outputs } = await supabase
      .from('research_outputs')
      .select('type, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    const ctx: ResearchContext = {};

    if (!outputs || outputs.length === 0) return ctx;

    for (const output of outputs) {
      const content = typeof output.content === 'string'
        ? JSON.parse(output.content)
        : output.content;

      switch (output.type) {
        case 'idea':
          if (!ctx.previousIdea) {
            ctx.previousIdea = {
              title: content.title,
              problem_statement: content.problem_statement,
              research_questions: content.research_questions,
              scope: content.scope,
            };
          }
          break;

        case 'structure':
          if (!ctx.previousStructure) {
            ctx.previousStructure = {
              chapters: content.chapters?.map((c: any) => ({ title: c.title })),
            };
          }
          break;

        case 'methodology':
          if (!ctx.previousMethodology) {
            ctx.previousMethodology = {
              method_suggestion: content.method_suggestion,
            };
          }
          break;
      }
    }

    // Also fetch project-level metadata
    const { data: project } = await supabase
      .from('projects')
      .select('research_topic')
      .eq('id', projectId)
      .single();

    if (project) {
      ctx.topic = project.research_topic;
    }

    return ctx;
  }
}
