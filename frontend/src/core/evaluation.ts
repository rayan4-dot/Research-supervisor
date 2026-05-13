/**
 * EvaluationEngine — AI-Powered Academic Scoring
 *
 * Scores the assembled research context across 4 academic dimensions.
 * This is NOT generation. It is assessment.
 *
 * Distinct from SupervisorReview:
 * - Review: critiques a specific piece of written text
 * - Evaluation: scores the entire research workflow/plan holistically
 */

import type { ResearchContext } from './prompts';
import type { ConsistencyReport } from './consistency';

export interface EvaluationScores {
  clarity: number;             // 0–10: Is the research intent clear and specific?
  methodological_validity: number; // 0–10: Does the method match type, field, and topic?
  structural_coherence: number;    // 0–10: Do all parts of the plan align logically?
  academic_rigor: number;          // 0–10: Does the research meet academic standards?
  overall: number;                 // 0–10: Weighted average
}

export interface EvaluationResult {
  scores: EvaluationScores;
  justifications: {
    clarity: string;
    methodological_validity: string;
    structural_coherence: string;
    academic_rigor: string;
  };
  rating: 'Insufficient' | 'Developing' | 'Competent' | 'Proficient' | 'Excellent';
  diagnosis: string;          // one paragraph — what this rating means
  priority_fix: string;       // the single most impactful thing to improve
  consistency_flags: string[]; // AI-detected contradictions between steps
  readiness: 'Not Ready' | 'Needs Work' | 'Nearly Ready' | 'Ready for Submission';
}

export class EvaluationEngine {
  static buildScoringPrompt(ctx: ResearchContext, consistencyReport?: ConsistencyReport | null): string {
    const contextDump = JSON.stringify({
      field: ctx.field,
      researchType: ctx.researchType,
      idea: ctx.previousIdea,
      structure: ctx.previousStructure,
      methodology: ctx.previousMethodology,
    }, null, 2);

    const arbitrationContext = consistencyReport ? `
ARBITRATION LAYER (HARD CONSTRAINTS):
A deterministic rule engine has already analyzed this research plan and found the following:
- Passed: ${consistencyReport.passed}
- Issues found: ${consistencyReport.issues.length}
- Issues: ${JSON.stringify(consistencyReport.issues.map(i => ({ severity: i.severity, issue: i.message })))}

CRITICAL ARBITRATION RULE:
1. You MUST NOT contradict the deterministic engine. If the deterministic engine found an 'error' (e.g., qualitative method in a quantitative study), your score for 'methodological_validity' MUST reflect this fundamental flaw (score < 5.0).
2. Your justifications must explicitly acknowledge any hard constraints violated here.
` : '';

    return `
You are a senior academic evaluation committee member at a Moroccan university.
You are reviewing a graduate research plan (not the final thesis — the plan).

Your role is to assess and score this plan with precision and rigor.
Do NOT give encouragement. Give accurate, calibrated scores.

RESEARCH PLAN DATA:
${contextDump}

${arbitrationContext}
Score the following dimensions on a scale of 0.0 to 10.0:

1. clarity (0–10):
   - Is the research topic specific, well-scoped, and academically relevant?
   - Are research questions clear, answerable, and non-trivial?
   - Is the problem statement meaningful and grounded?
   - Deduct heavily for vagueness, circular definitions, or journalistic framing.

2. methodological_validity (0–10):
   - Does the chosen methodology match the research type (qualitative/quantitative/mixed)?
   - Is the methodology appropriate for the academic field?
   - Are data collection methods specific and feasible?
   - Deduct for generic methods ("surveys"), missing sampling strategy, or field mismatches.

3. structural_coherence (0–10):
   - Do the chapter titles reflect the research questions?
   - Is the progression logical (introduction → literature → methodology → results)?
   - Are subsections specific and not generic?
   - Deduct for chapters that exist regardless of the topic (copy-paste structure).

4. academic_rigor (0–10):
   - Does the overall plan reflect graduate-level thinking?
   - Is there theoretical grounding implied?
   - Are hypotheses (if present) testable?
   - Is the scope realistic and bounded?
   - Deduct for no theoretical framework, no literature grounding, or bloated scope.

SCORING CALIBRATION:
- 9–10: Publishable plan, ready for committee review
- 7–8: Strong plan with minor refinements needed
- 5–6: Acceptable but significant gaps, needs rework
- 3–4: Weak plan, fundamental rethinking required
- 0–2: Not academically viable in current form

STRICT OUTPUT SCHEMA:
{
  "scores": {
    "clarity": 7.5,
    "methodological_validity": 6.0,
    "structural_coherence": 8.0,
    "academic_rigor": 7.0,
    "overall": 7.1
  },
  "justifications": {
    "clarity": "One sentence explaining exactly why clarity got this score.",
    "methodological_validity": "One sentence explaining exactly why methodological_validity got this score (mention deterministic errors if any).",
    "structural_coherence": "One sentence explaining exactly why structural_coherence got this score.",
    "academic_rigor": "One sentence explaining exactly why academic_rigor got this score."
  },
  "rating": "Competent",
  "diagnosis": "Two to three sentences. What does this score mean about the current research plan? Be direct.",
  "priority_fix": "The single most important thing the student must fix before anything else.",
  "consistency_flags": [
    "Any contradiction between steps — e.g., quantitative RQs with qualitative method",
    "Any logical gap — e.g., methodology doesn't address any research question"
  ],
  "readiness": "Needs Work"
}

RATING SCALE:
- overall >= 8.5: "Excellent"
- overall >= 7.0: "Proficient"
- overall >= 5.5: "Competent"
- overall >= 3.5: "Developing"
- overall < 3.5: "Insufficient"

READINESS SCALE:
- overall >= 8.0 and no consistency_flags: "Ready for Submission"
- overall >= 6.5: "Nearly Ready"
- overall >= 4.5: "Needs Work"
- otherwise: "Not Ready"

RETURN ONLY VALID JSON. No markdown. No explanation outside the JSON structure.
    `.trim();
  }

  static getRatingColor(rating: EvaluationResult['rating']): string {
    switch (rating) {
      case 'Excellent': return 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'Proficient': return 'text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'Competent': return 'text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30';
      case 'Developing': return 'text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30';
      case 'Insufficient': return 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
    }
  }

  static getReadinessColor(readiness: EvaluationResult['readiness']): string {
    switch (readiness) {
      case 'Ready for Submission': return 'text-green-600 dark:text-green-400';
      case 'Nearly Ready': return 'text-blue-600 dark:text-blue-400';
      case 'Needs Work': return 'text-amber-600 dark:text-amber-400';
      case 'Not Ready': return 'text-red-600 dark:text-red-400';
    }
  }

  static getScoreBar(score: number): string {
    const pct = Math.round((score / 10) * 100);
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 65) return 'bg-blue-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  }
}
