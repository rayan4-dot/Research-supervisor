"use client";

import { useEffect, useState } from "react";
import { useAI } from "@/hooks/useAI";
import { apiService } from "@/services/api";
import { ResearchService } from "@/services/research_service";
import Editor from "@/components/Editor";
import OutputPanel, { OutputSection, OutputList, RAGCitations } from "@/components/OutputPanel";
import type { Project, MethodologyOutput } from "@/models";
import type { AcademicField, ResearchContext, ResearchType } from "@/core/prompts";

const RESEARCH_TYPES: ResearchType[] = ["Qualitative", "Quantitative", "Mixed"];

export default function Methodology({ project }: { project: Project }) {
  const [topic, setTopic] = useState(project.research_topic || "");
  const [researchType, setResearchType] = useState<ResearchType>("Qualitative");
  const [context, setContext] = useState<ResearchContext>({});
  const { loading, result, error, generate, loadExisting } = useAI(project.id, "methodology");

  useEffect(() => {
    loadExisting();
    ResearchService.assembleContext(project.id).then((ctx) => {
      setContext(ctx);
      if (ctx.researchType) setResearchType(ctx.researchType);
    });
  }, [loadExisting, project.id]);

  const handleGenerate = () => {
    generate(() => apiService.generate.methodology(topic, researchType, context.field, context));
  };

  const output: MethodologyOutput | null = result;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full">
      <div className="lg:w-2/5 lg:border-r border-b lg:border-b-0 border-slate-200 dark:border-slate-700 pr-0 lg:pr-6 pb-6 lg:pb-0 space-y-5">
        <div>
          <h2 className="text-xl font-bold">🧪 Methodology Advisor</h2>
          <p className="text-sm opacity-50 mt-1">Disciplinarily-grounded method selection with ethical and validity guidance.</p>
        </div>

        <Editor label="Research Topic" value={topic} onChange={setTopic} placeholder="Enter your research topic..." minHeight="100px" />

        <div>
          <label className="text-sm font-medium opacity-70 block mb-2">Research Approach</label>
          <div className="flex gap-2">
            {RESEARCH_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setResearchType(type)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  researchType === type
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "border-slate-300 dark:border-slate-700 hover:border-primary/50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs opacity-40 mt-1.5">
            {researchType === "Qualitative" && "Deep, interpretive, inductive — interviews, observation, discourse"}
            {researchType === "Quantitative" && "Statistical, deductive, measurable — surveys, experiments, SPSS"}
            {researchType === "Mixed" && "Both approaches — must justify integration logic"}
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading || !topic.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          {loading ? <><span className="animate-spin">⟳</span> Advising...</> : <><span>🔬</span> Get Methodology Advice</>}
        </button>

        {context.previousIdea?.problem_statement && (
          <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="font-semibold">🧠 Memory:</span> Problem statement loaded from Idea Builder
          </div>
        )}

        {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">{error}</div>}
      </div>

      <div className="lg:w-3/5 lg:pl-6 pt-6 lg:pt-0">
        {!output && !loading ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center gap-3">
            <span className="text-5xl">🧪</span>
            <p className="text-sm">Your methodology plan will appear here</p>
          </div>
        ) : (
          <OutputPanel title="Methodology Plan" loading={loading} onCopy={() => JSON.stringify(output, null, 2)}>
            {output && (
              <>
                <OutputSection label="Method Suggestion">
                  <p className="font-semibold text-primary">{output.method_suggestion}</p>
                </OutputSection>
                <OutputSection label="Justification">
                  <p className="leading-relaxed">{output.justification}</p>
                </OutputSection>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Data Collection</p>
                    <OutputList items={output.data_collection_methods} />
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-2">Tools</p>
                    <OutputList items={output.tools} />
                  </div>
                </div>
                {output.sample_strategy && (
                  <OutputSection label="Sampling Strategy">
                    <p>{output.sample_strategy}</p>
                  </OutputSection>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {output.ethical_considerations && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2">⚖️ Ethics</p>
                      <p className="text-sm">{output.ethical_considerations}</p>
                    </div>
                  )}
                  {output.validity_approach && (
                    <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-xl p-4">
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wider mb-2">✓ Validity</p>
                      <p className="text-sm">{output.validity_approach}</p>
                    </div>
                  )}
                </div>
                {output.literature_grounding && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
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
