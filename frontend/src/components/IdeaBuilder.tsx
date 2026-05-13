"use client";

import { useEffect, useState, useCallback } from "react";
import { useAI } from "@/hooks/useAI";
import { apiService } from "@/services/api";
import { ResearchService } from "@/services/research_service";
import Editor from "@/components/Editor";
import OutputPanel, { OutputSection, OutputList, RAGCitations } from "@/components/OutputPanel";
import type { Project, IdeaOutput } from "@/models";
import type { AcademicField, ResearchContext } from "@/core/prompts";

const FIELDS: AcademicField[] = [
  "Humanities", "Literature", "Social Sciences", "Economics", "Technology & CS", "Law", "Medicine"
];

export default function IdeaBuilder({ project }: { project: Project }) {
  const [topic, setTopic] = useState(project.research_topic || "");
  const [field, setField] = useState<AcademicField>("Humanities");
  const [context, setContext] = useState<ResearchContext>({});
  const { loading, result, error, generate, loadExisting } = useAI(project.id, "idea");

  useEffect(() => {
    loadExisting();
    // Load research context memory
    ResearchService.assembleContext(project.id).then(setContext);
  }, [loadExisting, project.id]);

  const handleGenerate = () => {
    generate(() => apiService.generate.idea(topic, field, context));
  };

  const output: IdeaOutput | null = result;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full">
      {/* Left: Input Panel */}
      <div className="lg:w-2/5 lg:border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-700 pr-0 lg:pr-6 pb-6 lg:pb-0 space-y-5">
        <div>
          <h2 className="text-xl font-bold">🧩 Idea Builder</h2>
          <p className="text-sm opacity-50 mt-1">Transform a rough idea into a structured academic plan.</p>
        </div>

        <Editor
          label="Your Research Topic"
          value={topic}
          onChange={setTopic}
          placeholder="e.g. How does digital transformation affect traditional banking behavior in Morocco..."
          minHeight="160px"
          hint="The AI enforces field-specific academic rigor — choose your field below."
        />

        <div>
          <label className="text-sm font-medium opacity-70 block mb-2">Academic Field</label>
          <div className="flex flex-wrap gap-1.5">
            {FIELDS.map((f) => (
              <button
                key={f}
                onClick={() => setField(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  field === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-slate-300 dark:border-slate-700 hover:border-primary/50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? <><span className="animate-spin">⟳</span> Generating...</> : <><span>✨</span> Build Research Plan</>}
        </button>

        {context.previousIdea?.title && (
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-semibold">🧠 Memory:</span> Prior title — "{context.previousIdea.title}"
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Right: Output Panel */}
      <div className="lg:w-3/5 lg:pl-6 pt-6 lg:pt-0">
        {!output && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center gap-3">
            <span className="text-5xl">🧩</span>
            <p className="text-sm">Your generated plan will appear here</p>
          </div>
        ) : (
          <OutputPanel title="Research Plan" loading={loading} onCopy={() => JSON.stringify(output, null, 2)}>
            {output && (
              <>
                <div className="flex items-center justify-between">
                  <OutputSection label="Refined Title">
                    <p className="italic text-base font-semibold">"{output.title}"</p>
                  </OutputSection>
                  {output.academic_level && (
                    <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full shrink-0 ml-2">
                      {output.academic_level}
                    </span>
                  )}
                </div>
                <OutputSection label="Problem Statement">
                  <p>{output.problem_statement}</p>
                </OutputSection>
                <OutputSection label="Research Questions">
                  <OutputList items={output.research_questions} />
                </OutputSection>
                {output.hypotheses?.length > 0 && (
                  <OutputSection label="Hypotheses">
                    <OutputList items={output.hypotheses} />
                  </OutputSection>
                )}
                <OutputSection label="Scope">
                  <p>{output.scope}</p>
                </OutputSection>
                {output.literature_grounding && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <span>🧠</span> Source-Aware Reasoning
                    </p>
                    <p className="text-sm italic opacity-80">{output.literature_grounding}</p>
                  </div>
                )}
                <RAGCitations citations={output._citations || []} />
              </>
            )}
          </OutputPanel>
        )}
      </div>
    </div>
  );
}
