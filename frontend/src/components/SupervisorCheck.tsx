"use client";

import { useEffect, useState } from "react";
import { useAI } from "@/hooks/useAI";
import { apiService } from "@/services/api";
import { ResearchService } from "@/services/research_service";
import Editor from "@/components/Editor";
import OutputPanel, { OutputList } from "@/components/OutputPanel";
import type { Project, ReviewOutput, QualityRating } from "@/models";
import type { ResearchContext } from "@/core/prompts";

const QUALITY_STYLES: Record<QualityRating, string> = {
  poor: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  acceptable: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  good: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  excellent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function SupervisorCheck({ project }: { project: Project }) {
  const [text, setText] = useState("");
  const [context, setContext] = useState<ResearchContext>({});
  const { loading, result, error, generate, loadExisting } = useAI(project.id, "review");

  useEffect(() => {
    loadExisting();
    ResearchService.assembleContext(project.id).then(setContext);
  }, [loadExisting, project.id]);

  const handleGenerate = () => {
    generate(() => apiService.review.text(text, context));
  };

  const output: ReviewOutput | null = result;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full">
      <div className="lg:w-2/5 lg:border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-700 pr-0 lg:pr-6 pb-6 lg:pb-0 space-y-5">
        <div>
          <h2 className="text-xl font-bold">📝 Supervisor Review</h2>
          <p className="text-sm opacity-50 mt-1">
            Context-aware academic critique — the AI knows your topic, field, and prior decisions.
          </p>
        </div>

        <Editor
          label="Submit Text for Review"
          value={text}
          onChange={setText}
          placeholder="Paste your abstract, introduction, literature review, methodology section..."
          minHeight="240px"
          hint="The more complete your text, the more precise the critique."
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !text.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? <><span className="animate-spin">⟳</span> Reviewing...</> : <><span>🎓</span> Run Supervisor Review</>}
        </button>

        {(context.previousIdea?.title || context.field) && (
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-400">🧠 Review context loaded:</p>
            {context.previousIdea?.title && <p>Topic: "{context.previousIdea.title}"</p>}
            {context.field && <p>Field: {context.field}</p>}
            {context.previousMethodology?.method_suggestion && <p>Method: {context.previousMethodology.method_suggestion}</p>}
          </div>
        )}

        {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">{error}</div>}
      </div>

      <div className="lg:w-3/5 lg:pl-6 pt-6 lg:pt-0">
        {!output && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center gap-3">
            <span className="text-5xl">📝</span>
            <p className="text-sm">Submit text for supervisor feedback</p>
          </div>
        ) : (
          <OutputPanel title="Supervisor Feedback" loading={loading} onCopy={() => JSON.stringify(output, null, 2)}>
            {output && (
              <>
                {/* Score header */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full capitalize ${QUALITY_STYLES[output.overall_quality] || ''}`}>
                    {output.overall_quality}
                  </span>
                  <div>
                    <p className="font-semibold text-sm">{output.academic_score}</p>
                    <p className="text-xs opacity-50">Academic quality rating</p>
                  </div>
                </div>

                {/* Feedback blocks */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-2">✓ Strengths</p>
                  <OutputList items={output.strengths} />
                </div>

                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">✗ Weaknesses</p>
                  <OutputList items={output.weaknesses} />
                </div>

                {output.missing_elements?.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">⚠️ Missing Elements</p>
                    <OutputList items={output.missing_elements} />
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">💡 Improvements</p>
                  <OutputList items={output.improvements} />
                </div>

                {output.supervisor_verdict && (
                  <div className="border-l-4 border-primary pl-4 py-2">
                    <p className="text-xs font-semibold opacity-50 mb-1 uppercase">Supervisor Verdict</p>
                    <p className="text-sm leading-relaxed italic">{output.supervisor_verdict}</p>
                  </div>
                )}
              </>
            )}
          </OutputPanel>
        )}
      </div>
    </div>
  );
}
