import { NextResponse } from 'next/server';
import { EvaluationEngine } from '@/core/evaluation';
import { ConsistencyEngine } from '@/core/consistency';
import { AIService } from '@/services/ai_service';
import { TelemetryService } from '@/services/telemetry';
import { ResearchService } from '@/services/research_service';

export async function POST(req: Request) {
  try {
    const { project_id, context } = await req.json();

    // Use provided context or assemble from DB
    const ctx = context ?? (project_id ? await ResearchService.assembleContext(project_id) : {});

    // Guard: need at least one prior output to score
    if (!ctx.previousIdea && !ctx.previousStructure && !ctx.previousMethodology) {
      return NextResponse.json(
        { error: 'Not enough research data to evaluate. Complete at least the Idea Builder first.' },
        { status: 400 }
      );
    }

    // ARBITRATION LAYER: Run deterministic rules first to pass hard constraints to AI
    const consistencyReport = ConsistencyEngine.validate(ctx);

    const prompt = EvaluationEngine.buildScoringPrompt(ctx, consistencyReport);
    const result = await AIService.generate(prompt);

    if (result.scores && result.scores.overall < 6.0) {
      TelemetryService.log({
        event_type: 'LOW_EVALUATION_SCORE',
        project_id: ctx.projectId,
        details: { score: result.scores.overall, diagnosis: result.diagnosis }
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
