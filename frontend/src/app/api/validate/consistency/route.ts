import { NextResponse } from 'next/server';
import { ConsistencyEngine } from '@/core/consistency';
import { ResearchService } from '@/services/research_service';

export async function POST(req: Request) {
  try {
    const { project_id, context } = await req.json();

    // Use provided context or assemble from DB
    const ctx = context ?? (project_id ? await ResearchService.assembleContext(project_id) : {});

    const report = ConsistencyEngine.validate(ctx);

    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Consistency check error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
