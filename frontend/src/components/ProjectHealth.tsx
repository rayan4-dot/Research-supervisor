"use client";

import { useState } from "react";
import { EvaluationEngine } from "@/core/evaluation";
import type { ConsistencyReport, ConsistencyIssue, Severity } from "@/core/consistency";
import type { EvaluationResult } from "@/core/evaluation";

interface ProjectHealthProps {
  projectId: string;
  consistency: ConsistencyReport | null;
  evaluation: EvaluationResult | null;
  loadingConsistency: boolean;
  loadingEvaluation: boolean;
  onRunConsistency: () => void;
  onRunEvaluation: () => void;
}

const SEVERITY_STYLES: Record<Severity, string> = {
  error: 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400',
  warning: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400',
  info: 'border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400',
};

const SEVERITY_ICON: Record<Severity, string> = {
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

function ScoreBar({ label, value, justification }: { label: string; value: number; justification?: string }) {
  const pct = Math.round((value / 10) * 100);
  const colorClass = EvaluationEngine.getScoreBar(value);
  return (
    <div className="group">
      <div className="flex justify-between text-xs mb-1">
        <span className="opacity-60">{label}</span>
        <span className="font-semibold">{value.toFixed(1)}/10</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
      {justification && (
        <p className="text-[10px] leading-tight opacity-0 group-hover:opacity-70 transition-opacity mt-1 text-slate-500 dark:text-slate-400">
          {justification}
        </p>
      )}
    </div>
  );
}

export default function ProjectHealth({
  projectId, consistency, evaluation,
  loadingConsistency, loadingEvaluation,
  onRunConsistency, onRunEvaluation
}: ProjectHealthProps) {
  const [showIssues, setShowIssues] = useState(false);
  const [showScores, setShowScores] = useState(false);

  const errorCount = consistency?.issues.filter(i => i.severity === 'error').length ?? 0;
  const warningCount = consistency?.issues.filter(i => i.severity === 'warning').length ?? 0;

  const healthColor =
    !consistency ? 'text-slate-400' :
    errorCount > 0 ? 'text-red-500' :
    warningCount > 0 ? 'text-amber-500' : 'text-green-500';

  const healthIcon =
    !consistency ? '○' :
    errorCount > 0 ? '✗' :
    warningCount > 0 ? '⚠' : '✓';

  return (
    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider opacity-40">Project Health</p>

      {/* Consistency Check */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${healthColor}`}>
            <span>{healthIcon}</span> Consistency
            {consistency && <span className="opacity-60 font-normal">({consistency.score}/100)</span>}
          </span>
          <button
            onClick={onRunConsistency}
            disabled={loadingConsistency}
            className="text-xs text-primary hover:underline disabled:opacity-40"
          >
            {loadingConsistency ? '...' : 'Check'}
          </button>
        </div>

        {consistency && consistency.issues.length > 0 && (
          <>
            <button
              onClick={() => setShowIssues(!showIssues)}
              className="text-xs opacity-50 hover:opacity-100 transition-opacity"
            >
              {showIssues ? '▾ Hide' : '▸ Show'} {consistency.issues.length} issue(s)
            </button>
            {showIssues && (
              <div className="mt-2 space-y-1.5">
                {consistency.issues.map((issue, i) => (
                  <div key={i} className={`text-xs p-2 rounded-lg border ${SEVERITY_STYLES[issue.severity]}`}>
                    <p className="font-semibold">{SEVERITY_ICON[issue.severity]} {issue.message}</p>
                    <p className="opacity-70 mt-0.5">{issue.suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {consistency && consistency.issues.length === 0 && (
          <p className="text-xs text-green-600 dark:text-green-400 opacity-80">All checks passed ✓</p>
        )}
      </div>

      {/* Evaluation Score */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold flex items-center gap-1.5 opacity-70">
            🎓 Evaluation
            {evaluation && (
              <span className={`px-1.5 py-0.5 rounded text-xs font-bold capitalize ${EvaluationEngine.getRatingColor(evaluation.rating)}`}>
                {evaluation.rating}
              </span>
            )}
          </span>
          <button
            onClick={onRunEvaluation}
            disabled={loadingEvaluation}
            className="text-xs text-primary hover:underline disabled:opacity-40"
          >
            {loadingEvaluation ? 'Scoring...' : 'Score'}
          </button>
        </div>

        {evaluation && (
          <>
            <p className={`text-xs font-semibold mb-2 ${EvaluationEngine.getReadinessColor(evaluation.readiness)}`}>
              {evaluation.readiness}
            </p>
            <button
              onClick={() => setShowScores(!showScores)}
              className="text-xs opacity-50 hover:opacity-100 transition-opacity"
            >
              {showScores ? '▾ Hide' : '▸ Show'} scores
            </button>
            {showScores && (
              <div className="mt-2 space-y-2">
                <ScoreBar label="Clarity" value={evaluation.scores.clarity} justification={evaluation.justifications?.clarity} />
                <ScoreBar label="Methodology" value={evaluation.scores.methodological_validity} justification={evaluation.justifications?.methodological_validity} />
                <ScoreBar label="Structure" value={evaluation.scores.structural_coherence} justification={evaluation.justifications?.structural_coherence} />
                <ScoreBar label="Rigor" value={evaluation.scores.academic_rigor} justification={evaluation.justifications?.academic_rigor} />
                <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
                  <ScoreBar label="Overall" value={evaluation.scores.overall} />
                </div>
                {evaluation.priority_fix && (
                  <div className="text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 p-2 rounded-lg mt-1">
                    <p className="font-semibold opacity-60 mb-0.5">Priority fix:</p>
                    <p className="leading-snug">{evaluation.priority_fix}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
