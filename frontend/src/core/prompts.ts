/**
 * PromptEngine — Core Academic Intelligence Layer
 *
 * Principles:
 * - Every prompt enforces a STRICT JSON contract (no deviation allowed)
 * - Prompts are field-aware: Humanities ≠ CS ≠ Law ≠ Medicine
 * - AI is instructed to behave as a Moroccan university supervisor
 * - Context from previous outputs is injected for state-awareness
 */

export type AcademicField =
  | 'Humanities'
  | 'Literature'
  | 'Social Sciences'
  | 'Economics'
  | 'Technology & CS'
  | 'Law'
  | 'Medicine';

export type ResearchType = 'Qualitative' | 'Quantitative' | 'Mixed';

export interface ResearchContext {
  topic?: string;
  field?: AcademicField;
  researchType?: ResearchType;
  projectId?: string;
  ragContext?: string;
  previousIdea?: {
    title?: string;
    problem_statement?: string;
    research_questions?: string[];
    scope?: string;
  };
  previousStructure?: {
    chapters?: { title: string }[];
  };
  previousMethodology?: {
    method_suggestion?: string;
  };
}

// ─────────────────────────────────────────────
// FIELD CONSTRAINT MAP — defines academic rules per discipline
// ─────────────────────────────────────────────
const FIELD_CONSTRAINTS: Record<string, string> = {
  'Humanities': `
    - Outputs must be theoretically grounded (e.g., reference conceptual frameworks, philosophers, critical theorists)
    - Research questions must be interpretive and analytical, NOT empirical
    - Avoid quantitative language; prefer hermeneutic, phenomenological, or critical approaches
    - Chapters must include a dedicated Theoretical Framework section
    - Scope must acknowledge cultural, historical, and societal dimensions`,

  'Literature': `
    - Focus on textual analysis, literary movements, and author context
    - Research questions must revolve around interpretation, theme, structure, or style
    - Methodology must favor close reading, comparative analysis, or discourse analysis
    - Avoid social science framing; stay within literary criticism conventions
    - Reference relevant schools: postcolonialism, feminism, structuralism, etc. where appropriate`,

  'Social Sciences': `
    - Must ground the study in a social theory (e.g., Bourdieu, Giddens, Foucault)
    - Research questions must address social patterns, structures, or behaviors
    - Methodology must specify population, sample, and data collection approach
    - Include an ethical considerations subsection in methodology
    - Outputs must reference field context (Morocco, MENA region, or comparative international)`,

  'Economics': `
    - Frame around an economic model or theory (Keynesian, neoclassical, institutional, etc.)
    - Research questions must be measurable and anchored in data availability
    - Methodology must favor econometric models, regression, panel data, or time series
    - Ensure chapters include a dedicated data section and descriptive statistics
    - Scope must reference the Moroccan economic context or comparable developing economies`,

  'Technology & CS': `
    - Research must be technically specific: specify algorithm, system architecture, or dataset
    - Research questions must be falsifiable and testable with metrics
    - Methodology must include implementation details, evaluation metrics, and benchmarks
    - Structure must include a "Related Work" chapter, not "Literature Review"
    - Outputs must reference relevant technical standards, datasets, or APIs`,

  'Law': `
    - Frame within a specific legal system (Moroccan law, Sharia law, civil law, etc.)
    - Research questions must focus on legal gaps, conflicts, or interpretations
    - Methodology must be doctrinal (normative analysis) or socio-legal
    - Chapters must cite relevant legal texts, statutes, and jurisprudence
    - Avoid empirical language unless specifically doing socio-legal research`,

  'Medicine': `
    - Research must follow clinical or public health research conventions
    - Research questions must be clinically relevant and PICO-structured where applicable
    - Methodology must specify study design (RCT, cohort, cross-sectional, etc.), population, and ethics approval
    - Outputs must reference evidence-based medicine standards (CONSORT, PRISMA, etc.)
    - Include patient safety and data protection considerations`,
};

// ─────────────────────────────────────────────
// RESEARCH TYPE CONSTRAINT MAP
// ─────────────────────────────────────────────
const RESEARCH_TYPE_RULES: Record<string, string> = {
  'Qualitative': `
    - Data collection: interviews, focus groups, ethnography, observation, document analysis
    - Analysis: thematic analysis, grounded theory, discourse analysis, narrative analysis
    - Sample: purposive, snowball, or theoretical sampling — NOT random probability
    - Tools: NVivo, MAXQDA, Atlas.ti, or manual coding
    - Validity: trustworthiness, credibility, transferability — NOT statistical significance`,

  'Quantitative': `
    - Data collection: surveys, experiments, structured observation, existing databases
    - Analysis: descriptive statistics, inferential statistics, regression, ANOVA
    - Sample: probabilistic sampling, minimum sample size must be justified
    - Tools: SPSS, R, Stata, Python (pandas/scipy), Excel
    - Validity: reliability (Cronbach's alpha), validity (construct, content, criterion)`,

  'Mixed': `
    - Must explicitly justify why both qualitative AND quantitative approaches are needed
    - Specify whether design is sequential (qual → quant or quant → qual) or concurrent
    - Each strand must have its own data collection strategy and analysis plan
    - Tools: combination of interview protocols + survey instruments
    - Integration point must be clearly defined (at data collection, analysis, or interpretation level)`,
};

export class PromptEngine {
  // ─────────────────────────────────────
  // SYSTEM IDENTITY (injected in every prompt)
  // ─────────────────────────────────────
  private static getSystemIdentity(): string {
    return `
You are a strict, expert academic research supervisor for Moroccan universities (system: Bac+5 Master's / Doctorat level).
Your role is NOT to generate generic AI text. You are a disciplined academic who enforces rigor.

CORE RULES YOU MUST ALWAYS FOLLOW:
1. Every output must match the exact JSON schema specified — no extra fields, no missing fields.
2. Research questions must be academically specific — never vague or journalistic.
3. You must reason about the academic field and apply its disciplinary norms.
4. Outputs must feel like a real Moroccan university thesis, not a blog post.
5. Never invent citations. Never fabricate statistics.
6. If a hypothesis is not applicable (e.g., in purely exploratory qualitative research), return an empty array — do NOT force one.
7. SOURCE AWARENESS: If "LITERATURE REPOSITORY CONTEXT (RAG)" is provided, you MUST explicitly attribute insights or structural choices to the specific citations (e.g., "following [Citation 1]").
    `.trim();
  }

  // ─────────────────────────────────────
  // CONTEXT MEMORY INJECTOR
  // ─────────────────────────────────────
  private static injectContext(ctx?: ResearchContext): string {
    if (!ctx) return '';
    const parts: string[] = ['--- RESEARCH STATE MEMORY (from previous decisions) ---'];

    if (ctx.previousIdea?.title) {
      parts.push(`Previously refined title: "${ctx.previousIdea.title}"`);
    }
    if (ctx.previousIdea?.problem_statement) {
      parts.push(`Established problem statement: "${ctx.previousIdea.problem_statement}"`);
    }
    if (ctx.previousIdea?.research_questions?.length) {
      parts.push(`Research questions already defined:\n${ctx.previousIdea.research_questions.map((q, i) => `  ${i + 1}. ${q}`).join('\n')}`);
    }
    if (ctx.previousStructure?.chapters?.length) {
      parts.push(`Thesis structure already defined (chapters): ${ctx.previousStructure.chapters.map(c => c.title).join(', ')}`);
    }
    if (ctx.previousMethodology?.method_suggestion) {
      parts.push(`Methodology approach already chosen: ${ctx.previousMethodology.method_suggestion}`);
    }
    if (ctx.field) {
      parts.push(`Academic field: ${ctx.field}`);
    }
    if (ctx.researchType) {
      parts.push(`Research type: ${ctx.researchType}`);
    }
    parts.push('--- END MEMORY --- \nUse this memory to ensure consistency. Do not contradict decisions already made.\n');
    return parts.join('\n');
  }

  // ─────────────────────────────────────
  // PROMPT 1 — IDEA BUILDER
  // ─────────────────────────────────────
  static buildIdeaPrompt(topic: string, ctx?: ResearchContext): string {
    const fieldConstraints = ctx?.field ? FIELD_CONSTRAINTS[ctx.field] : '';
    const ragInjection = ctx?.ragContext ? `\nLITERATURE REPOSITORY CONTEXT (RAG):\nYou must ground your response in the following excerpts from academic literature. If they are relevant, use them to enrich the problem statement or hypotheses.\n---\n${ctx.ragContext}\n---\n` : '';

    return `
${this.getSystemIdentity()}

${this.injectContext(ctx)}
${ragInjection}

TASK: Research Idea Builder
A student wants to research: "${topic}"
${ctx?.field ? `Academic Field: ${ctx.field}` : ''}

${fieldConstraints ? `FIELD-SPECIFIC CONSTRAINTS FOR ${ctx?.field}:\n${fieldConstraints}` : ''}

STRICT OUTPUT SCHEMA — you MUST return EXACTLY this JSON structure:
{
  "title": "A precise, academic thesis title (no more than 15 words, no generic words like 'Study of' or 'Analysis of')",
  "problem_statement": "2-3 sentences. Must clearly state: (1) the gap in knowledge or practice, (2) why it matters, (3) what this research will address.",
  "research_questions": [
    "RQ1: Specific, answerable question — NOT a hypothesis",
    "RQ2: ...",
    "RQ3: ... (3 minimum, 5 maximum)"
  ],
  "hypotheses": [
    "H1: If applicable — a testable proposition. If qualitative/exploratory research, return empty array []"
  ],
  "scope": "What is IN scope and OUT of scope. Geographic, temporal, and thematic limits.",
  "academic_level": "Master's Research (Bac+5) or Doctoral Research — based on complexity",
  "literature_grounding": "1-2 sentences explaining how the retrieved literature influenced this research idea (mention specific Citations if relevant). If no literature was provided, return 'General reasoning used.'"
}

RETURN ONLY VALID JSON. No markdown. No explanation. No preamble.
    `.trim();
  }

  // ─────────────────────────────────────
  // PROMPT 2 — THESIS STRUCTURE
  // ─────────────────────────────────────
  static buildStructurePrompt(topic: string, field: AcademicField, ctx?: ResearchContext): string {
    const fieldConstraints = FIELD_CONSTRAINTS[field] || '';
    const ragInjection = ctx?.ragContext ? `\nLITERATURE REPOSITORY CONTEXT (RAG):\n---\n${ctx.ragContext}\n---\n` : '';

    return `
${this.getSystemIdentity()}

${this.injectContext({ ...ctx, field })}
${ragInjection}

TASK: Thesis Structure Generator
Topic: "${topic}"
Field: ${field}

FIELD-SPECIFIC STRUCTURAL CONSTRAINTS:
${fieldConstraints}

You must produce a chapter architecture that strictly follows ${field} disciplinary conventions.
Do NOT produce a generic 3-chapter structure — adapt it to the field.

STRICT OUTPUT SCHEMA:
{
  "chapters": [
    {
      "number": 1,
      "title": "Full chapter title",
      "rationale": "One sentence — why this chapter exists and what it achieves",
      "subsections": [
        "1.1 Subsection title",
        "1.2 Subsection title",
        "1.3 Subsection title"
      ]
    }
  ],
  "literature_grounding": "Explain how the chapter sequence or rationale is informed by the retrieved literature."
}

RULES:
- Minimum 3 chapters, maximum 5 chapters
- Every chapter must have at least 3 subsections
- Subsection titles must be specific (not "Introduction" or "Conclusion" as a subsection)
- The final chapter must be methodology + analysis (or combined results/discussion for empirical work)

RETURN ONLY VALID JSON.
    `.trim();
  }

  // ─────────────────────────────────────
  // PROMPT 3 — METHODOLOGY ADVISOR
  // ─────────────────────────────────────
  static buildMethodologyPrompt(topic: string, researchType: ResearchType, field?: AcademicField, ctx?: ResearchContext): string {
    const typeRules = RESEARCH_TYPE_RULES[researchType];
    const fieldConstraints = field ? FIELD_CONSTRAINTS[field] : '';
    const ragInjection = ctx?.ragContext ? `\nLITERATURE REPOSITORY CONTEXT (RAG):\n---\n${ctx.ragContext}\n---\n` : '';

    return `
${this.getSystemIdentity()}

${this.injectContext({ ...ctx, field, researchType })}

TASK: Methodology Advisor
Topic: "${topic}"
Research Type: ${researchType}
${field ? `Academic Field: ${field}` : ''}

RESEARCH TYPE RULES (enforce these strictly):
${typeRules}

${fieldConstraints ? `FIELD CONSTRAINTS:\n${fieldConstraints}` : ''}
${ragInjection}

STRICT OUTPUT SCHEMA:
{
  "method_suggestion": "Specific named methodology (e.g., 'Descriptive Survey Study' or 'Interpretive Phenomenological Analysis') — NOT just 'Qualitative'",
  "justification": "3-4 sentences. Explain why this methodology is the most appropriate for this specific topic AND research type. Reference epistemological alignment.",
  "data_collection_methods": [
    "Specific method 1 (with details — e.g., 'Semi-structured interviews with 15–20 participants' not just 'interviews')",
    "..."
  ],
  "tools": [
    "Tool name: brief justification for its use",
    "..."
  ],
  "sample_strategy": "Who will be sampled, how many, and why — appropriate to the research type",
  "ethical_considerations": "Key ethical issues relevant to this study (confidentiality, consent, access, etc.)",
  "validity_approach": "How rigor/validity will be ensured — must match the research type (e.g., triangulation for qualitative, Cronbach's alpha for quantitative)",
  "literature_grounding": "Justify the methodological choice by referencing patterns or standards found in the retrieved literature."
}

RETURN ONLY VALID JSON.
    `.trim();
  }

  // ─────────────────────────────────────
  // PROMPT 4 — SUPERVISOR REVIEW (upgraded)
  // ─────────────────────────────────────
  static buildReviewPrompt(text: string, ctx?: ResearchContext): string {
    const contextSummary = ctx?.previousIdea
      ? `Known project context:\n- Title: ${ctx.previousIdea.title || 'unknown'}\n- Field: ${ctx.field || 'unknown'}\n- Problem: ${ctx.previousIdea.problem_statement || 'unknown'}`
      : '';

    return `
${this.getSystemIdentity()}

${this.injectContext(ctx)}

TASK: Supervisor Review — Academic Text Critique
${contextSummary ? `\n${contextSummary}\n` : ''}

STUDENT TEXT SUBMITTED FOR REVIEW:
"""
${text}
"""

You must now review this text as a strict Moroccan university research supervisor would.
Apply academic rigor. Do NOT be encouraging or vague — be precise and critical.

DETECTION RULES:
- Flag weak logic: circular reasoning, unsupported claims, missing evidence
- Flag missing parts: no theoretical grounding, no clear research gap, no methodology
- Flag structural problems: paragraphs that lack topic sentences, no transitions, no academic voice
- Flag methodology mismatches: if stated or implied approach contradicts the research type
- Flag language issues: informal register, non-academic vocabulary, vague generalizations

STRICT OUTPUT SCHEMA:
{
  "overall_quality": "poor | acceptable | good | excellent",
  "academic_score": "X/10 — with brief justification",
  "strengths": [
    "Specific strength with quote or reference to the text"
  ],
  "weaknesses": [
    "Specific weakness — what is wrong and WHY it is academically problematic"
  ],
  "missing_elements": [
    "What is absent that a thesis of this type MUST contain"
  ],
  "improvements": [
    "Concrete, actionable instruction — not 'improve this', but 'do X by doing Y'"
  ],
  "supervisor_verdict": "One direct paragraph — what a supervisor would say in a meeting. Honest, direct, constructive."
}

RETURN ONLY VALID JSON.
    `.trim();
  }
}
