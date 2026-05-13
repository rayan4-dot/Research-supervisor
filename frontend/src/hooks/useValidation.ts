"use client";

import { useState, useCallback } from 'react';
import type { ConsistencyReport } from '@/core/consistency';
import type { EvaluationResult } from '@/core/evaluation';
import type { ResearchContext } from '@/core/prompts';

export interface ValidationState {
  consistency: ConsistencyReport | null;
  evaluation: EvaluationResult | null;
  loadingConsistency: boolean;
  loadingEvaluation: boolean;
  error: string | null;
}

export function useValidation(projectId: string) {
  const [consistency, setConsistency] = useState<ConsistencyReport | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [loadingConsistency, setLoadingConsistency] = useState(false);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Runs the deterministic consistency check (fast, no AI).
   * Call this after every generation to detect cross-step issues immediately.
   */
  const runConsistencyCheck = useCallback(async (context?: ResearchContext) => {
    setLoadingConsistency(true);
    setError(null);
    try {
      const res = await fetch('/api/validate/consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, context }),
      });
      if (!res.ok) throw new Error('Consistency check failed');
      const data: ConsistencyReport = await res.json();
      setConsistency(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoadingConsistency(false);
    }
  }, [projectId]);

  /**
   * Runs the AI-powered evaluation (slower, comprehensive).
   * Call this on-demand — not after every keystroke.
   */
  const runEvaluation = useCallback(async (context?: ResearchContext) => {
    setLoadingEvaluation(true);
    setError(null);
    try {
      const res = await fetch('/api/validate/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, context }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Evaluation failed');
      }
      const data: EvaluationResult = await res.json();
      setEvaluation(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoadingEvaluation(false);
    }
  }, [projectId]);

  return {
    consistency,
    evaluation,
    loadingConsistency,
    loadingEvaluation,
    error,
    runConsistencyCheck,
    runEvaluation,
  };
}
