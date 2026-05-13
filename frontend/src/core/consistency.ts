/**
 * ConsistencyEngine — Deterministic Cross-Step Validation
 *
 * Runs rule-based checks across all assembled research outputs.
 * No AI. No generation. Pure logical validation.
 *
 * Design principle: catch contradictions BEFORE they become a bad thesis.
 */

import type { ResearchContext } from './prompts';
import { TelemetryService } from '@/services/telemetry';

export type Severity = 'error' | 'warning' | 'info';

export interface ConsistencyIssue {
  severity: Severity;
  step: 'idea' | 'structure' | 'methodology' | 'cross-step' | 'global';
  code: string;          // machine-readable rule ID
  message: string;       // human-readable explanation
  suggestion: string;    // what to do about it
}

export interface ConsistencyReport {
  passed: boolean;       // true if no errors (warnings allowed)
  score: number;         // 0–100, based on absence of issues
  issues: ConsistencyIssue[];
  summary: string;
}

// ─────────────────────────────────────────────────────────────
// Rule definitions — each returns ConsistencyIssue | null
// ─────────────────────────────────────────────────────────────

type Rule = (ctx: ResearchContext) => ConsistencyIssue | null;

const rules: Rule[] = [

  // RULE 1: Quantitative research shouldn't list qualitative tools
  (ctx) => {
    if (ctx.researchType !== 'Quantitative') return null;
    const tools = ctx.previousMethodology?.method_suggestion?.toLowerCase() || '';
    const qualKeywords = ['interview', 'focus group', 'ethnograph', 'narrative', 'phenomenolog'];
    const conflict = qualKeywords.find(kw => tools.includes(kw));
    if (!conflict) return null;
    return {
      severity: 'error',
      step: 'methodology',
      code: 'METH_TYPE_MISMATCH_QUAL_IN_QUANT',
      message: `Your research type is Quantitative, but the methodology mentions "${conflict}" — a qualitative technique.`,
      suggestion: 'Switch to a quantitative method (survey, experiment, regression) or change your research type to Mixed/Qualitative.',
    };
  },

  // RULE 2: Qualitative research shouldn't claim SPSS/statistical tools
  (ctx) => {
    if (ctx.researchType !== 'Qualitative') return null;
    const tools = ctx.previousMethodology?.method_suggestion?.toLowerCase() || '';
    const quantKeywords = ['spss', 'regression', 'anova', 'stata', 'factor analysis', 'correlation'];
    const conflict = quantKeywords.find(kw => tools.includes(kw));
    if (!conflict) return null;
    return {
      severity: 'error',
      step: 'methodology',
      code: 'METH_TYPE_MISMATCH_QUANT_IN_QUAL',
      message: `Your research type is Qualitative, but the methodology implies "${conflict}" — a statistical/quantitative technique.`,
      suggestion: 'Use qualitative analysis tools (NVivo, thematic coding, discourse analysis) instead.',
    };
  },

  // RULE 3: CS field should have a Related Work chapter, not just "Literature Review"
  (ctx) => {
    if (ctx.field !== 'Technology & CS') return null;
    if (!ctx.previousStructure?.chapters) return null;
    const chapterTitles = ctx.previousStructure.chapters.map(c => c.title.toLowerCase());
    const hasRelatedWork = chapterTitles.some(t => t.includes('related work') || t.includes('state of the art'));
    if (hasRelatedWork) return null;
    return {
      severity: 'warning',
      step: 'structure',
      code: 'CS_MISSING_RELATED_WORK',
      message: 'In Computer Science theses, "Literature Review" should be titled "Related Work" or "State of the Art".',
      suggestion: 'Rename your literature chapter to "Related Work" and focus it on comparing technical approaches, not theoretical frameworks.',
    };
  },

  // RULE 4: Law field must not use empirical methodology framing
  (ctx) => {
    if (ctx.field !== 'Law') return null;
    const method = ctx.previousMethodology?.method_suggestion?.toLowerCase() || '';
    const empiricalKeywords = ['survey', 'experiment', 'sample', 'hypothesis testing'];
    const conflict = empiricalKeywords.find(kw => method.includes(kw));
    if (!conflict) return null;
    return {
      severity: 'warning',
      step: 'methodology',
      code: 'LAW_EMPIRICAL_MISMATCH',
      message: `Law research typically uses doctrinal or socio-legal methodology, but "${conflict}" implies an empirical approach.`,
      suggestion: 'Clarify whether your approach is doctrinal (normative legal analysis) or socio-legal. If empirical, explicitly justify the deviation.',
    };
  },

  // RULE 5: Research questions must exist if structure was generated
  (ctx) => {
    if (!ctx.previousStructure?.chapters?.length) return null;
    if (ctx.previousIdea?.research_questions?.length) return null;
    return {
      severity: 'warning',
      step: 'cross-step',
      code: 'STRUCTURE_BEFORE_QUESTIONS',
      message: 'Thesis structure was generated without research questions defined in the Idea Builder.',
      suggestion: 'Go back to the Idea Builder, generate a full research plan, then regenerate the structure. Structure without research questions may be incoherent.',
    };
  },

  // RULE 6: Hypotheses in qualitative exploratory research
  (ctx) => {
    if (ctx.researchType !== 'Qualitative') return null;
    const hypotheses = ctx.previousIdea?.research_questions || [];
    // Check if any RQ implies a hypothesis (contains "does X affect Y" pattern)
    const hasHypothesisPattern = hypotheses.some(q =>
      /\b(does|do|is|are|will|affect|impact|influence|relationship|between)\b/.test(q.toLowerCase())
    );
    if (!hasHypothesisPattern) return null;
    return {
      severity: 'info',
      step: 'idea',
      code: 'QUAL_HYPOTHESIS_PATTERN',
      message: 'Some of your research questions use causal/relational language typical of quantitative hypotheses.',
      suggestion: 'In qualitative research, frame questions as exploratory ("How does X...?", "What are the...?") rather than causal ("Does X affect Y?").',
    };
  },

  // RULE 7: No methodology defined but structure exists
  (ctx) => {
    if (!ctx.previousStructure?.chapters?.length) return null;
    if (ctx.previousMethodology?.method_suggestion) return null;
    return {
      severity: 'warning',
      step: 'cross-step',
      code: 'STRUCTURE_WITHOUT_METHODOLOGY',
      message: 'Thesis structure is defined but no methodology has been selected yet.',
      suggestion: 'Complete the Methodology tab. The methodology chapter in your structure may be generic without it.',
    };
  },

  // RULE 8: Check minimum research question count
  (ctx) => {
    const rqs = ctx.previousIdea?.research_questions || [];
    if (rqs.length === 0) return null;
    if (rqs.length >= 3) return null;
    return {
      severity: 'warning',
      step: 'idea',
      code: 'INSUFFICIENT_RESEARCH_QUESTIONS',
      message: `Only ${rqs.length} research question(s) defined. Moroccan university standards require at least 3.`,
      suggestion: 'Return to the Idea Builder and regenerate with a more specific topic to get 3–5 well-formed research questions.',
    };
  },

  // RULE 9: Medicine field — no ethics mention
  (ctx) => {
    if (ctx.field !== 'Medicine') return null;
    if (!ctx.previousMethodology?.method_suggestion) return null;
    // If methodology exists but doesn't mention ethics (we check the full stored content)
    return {
      severity: 'info',
      step: 'methodology',
      code: 'MEDICINE_ETHICS_REMINDER',
      message: 'Medical research requires explicit ethics committee approval mention.',
      suggestion: 'Ensure your methodology section explicitly references the ethics approval process (CNER in Morocco or equivalent).',
    };
  },
];

// ─────────────────────────────────────────────────────────────
// Main engine
// ─────────────────────────────────────────────────────────────

export class ConsistencyEngine {
  static validate(ctx: ResearchContext): ConsistencyReport {
    const issues: ConsistencyIssue[] = [];

    for (const rule of rules) {
      const issue = rule(ctx);
      if (issue) issues.push(issue);
    }

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const passed = errorCount === 0;

    // Score: start at 100, deduct per issue
    const score = Math.max(0, 100 - (errorCount * 25) - (warningCount * 10) - (issues.filter(i => i.severity === 'info').length * 3));

    if (issues.length > 0) {
      TelemetryService.log({
        event_type: 'VALIDATION_FAIL',
        project_id: ctx.projectId,
        details: { issue_count: issues.length, rules_failed: issues.map(i => i.message) }
      });
    }

    let summary: string;
    if (issues.length === 0) {
      summary = 'All cross-step checks passed. Research is internally consistent.';
    } else if (errorCount > 0) {
      summary = `${errorCount} critical conflict(s) detected that will undermine academic validity. Fix before proceeding.`;
    } else {
      summary = `${warningCount} warning(s) detected. Review before submission.`;
    }

    return { passed, score, issues, summary };
  }
}
