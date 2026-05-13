import { supabase } from '@/lib/supabase';

export type EventType = 
  | 'GENERATION_SUCCESS'
  | 'GENERATION_ERROR'
  | 'AI_RETRY'
  | 'VALIDATION_FAIL'
  | 'VALIDATION_PASS'
  | 'LOW_EVALUATION_SCORE'
  | 'RAG_RETRIEVAL';

interface TelemetryEvent {
  event_type: EventType;
  project_id?: string;
  user_id?: string;
  details?: Record<string, any>;
}

export class TelemetryService {
  /**
   * Fire-and-forget telemetry logging.
   * Fails silently so it never interrupts the user workflow.
   */
  static async log(event: TelemetryEvent) {
    try {
      await supabase.from('event_logs').insert([event]);
    } catch (e) {
      // Telemetry should never crash the app
      console.warn('Telemetry logging failed', e);
    }
  }
}
