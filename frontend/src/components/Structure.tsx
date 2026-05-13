"use client";

import { useEffect, useState } from "react";
import { useAI } from "@/hooks/useAI";
import { apiService } from "@/services/api";
import { ResearchService } from "@/services/research_service";
import Editor from "@/components/Editor";
import OutputPanel, { OutputSection, RAGCitations } from "@/components/OutputPanel";
import type { Project, StructureOutput } from "@/models";
import type { AcademicField, ResearchContext } from "@/core/prompts";

const FIELDS: AcademicField[] = [
  "Humanities", "Literature", "Social Sciences", "Economics", "Technology & CS", "Law", "Medicine"
];

export default function Structure({ project }: { project: Project }) {
  const [topic, setTopic] = useState(project.research_topic || "");
  const [field, setField] = useState<AcademicField>("Humanities");
  const [context, setContext] = useState<ResearchContext>({});
  const { loading, result, error, generate, loadExisting } = useAI(project.id, "structure");

  useEffect(() => {
    loadExisting();
    ResearchService.assembleContext(project.id).then((ctx) => {
      setContext(ctx);
      if (ctx.field) setField(ctx.field);
    });
  }, [loadExisting, project.id]);

  const handleGenerate = () => {
    generate(() => apiService.generate.structure(topic, field, context));
  };

  const output: StructureOutput | null = result;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full">
      <div className="lg:w-2/5 lg:border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-700 pr-0 lg:pr-6 pb-6 lg:pb-0 space-y-5">
        <div>
          <h2 className="text-xl font-bold">📚 Thesis Structure</h2>
          <p className="text-sm opacity-50 mt-1">Field-aware chapter architecture — not generic, discipline-specific.</p>
        </div>

        <Editor label="Research Topic" value={topic} onChange={setTopic} placeholder="Enter your research topic..." minHeight="100px" />

        <div>
          <label className="text-sm font-medium opacity-70 block mb-2">Academic Field</label>
          <div className="flex flex-wrap gap-1.5">
            {FIELDS.map((f) => (
              <button
                key={f}
                onClick={() => setField(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  field === f ? "bg-primary text-primary-foreground border-primary" : "border-slate-300 dark:border-slate-700 hover:border-primary/50"
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
          {loading ? <><span className="animate-spin">⟳</span> Structuring...</> : <><span>📐</span> Generate Structure</>}
        </button>

        {context.previousIdea?.research_questions?.length && (
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-semibold">🧠 Memory:</span> {context.previousIdea.research_questions.length} research questions carried from Idea Builder
          </div>
        )}

        {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">{error}</div>}
      </div>

      <div className="lg:w-3/5 lg:pl-6 pt-6 lg:pt-0">
        {!output && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center gap-3">
            <span className="text-5xl">📚</span>
            <p className="text-sm">Your chapter structure will appear here</p>
          </div>
        ) : (
          <OutputPanel title="Thesis Outline" loading={loading} onCopy={() => JSON.stringify(output, null, 2)}>
            {output && (
              <div className="space-y-3">
                {output.chapters?.map((chapter, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5">
                      <p className="font-semibold text-sm text-primary">{chapter.title}</p>
                      {chapter.rationale && (
                        <p className="text-xs opacity-50 mt-0.5 italic">{chapter.rationale}</p>
                      )}
                    </div>
                    <ul className="px-4 py-3 space-y-1.5">
                      {chapter.subsections?.map((sub, j) => (
                        <li key={j} className="text-sm flex items-start gap-2 opacity-80">
                          <span className="text-primary mt-0.5 shrink-0">›</span>{sub}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {output.literature_grounding && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">
                      <span>🧠</span> Source-Aware Reasoning
                    </p>
                    <p className="text-sm italic opacity-80">{output.literature_grounding}</p>
                  </div>
                )}
                <RAGCitations citations={output._citations || []} />
              </div>
            )}
          </OutputPanel>
        )}
      </div>
    </div>
  );
}
