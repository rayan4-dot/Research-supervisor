"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProject } from "@/hooks/useProject";
import { useValidation } from "@/hooks/useValidation";
import { ResearchService } from "@/services/research_service";
import Sidebar from "@/components/Sidebar";
import ProjectHealth from "@/components/ProjectHealth";
import IdeaBuilder from "@/components/IdeaBuilder";
import Structure from "@/components/Structure";
import Methodology from "@/components/Methodology";
import SupervisorCheck from "@/components/SupervisorCheck";
import type { ResearchContext } from "@/core/prompts";
import { useAuth } from "@/hooks/useAuth";

export default function ProjectWorkspace() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { project, loading } = useProject(id);
  const [activeTab, setActiveTab] = useState("idea");
  const [researchContext, setResearchContext] = useState<ResearchContext>({});

  const {
    consistency, evaluation,
    loadingConsistency, loadingEvaluation,
    runConsistencyCheck, runEvaluation,
  } = useValidation(id);

  const { user, loading: authLoading } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Assemble context on mount, then run initial consistency check
  useEffect(() => {
    if (!id) return;
    ResearchService.assembleContext(id).then((ctx) => {
      setResearchContext(ctx);
      runConsistencyCheck(ctx);
    });
  }, [id]);

  // Re-run consistency after each tab switch (context may have been updated)
  const handleTabChange = useCallback(async (tab: string) => {
    setActiveTab(tab);
    const ctx = await ResearchService.assembleContext(id);
    setResearchContext(ctx);
    runConsistencyCheck(ctx);
  }, [id, runConsistencyCheck]);

  const handleRunEvaluation = async () => {
    const ctx = await ResearchService.assembleContext(id);
    runEvaluation(ctx);
  };

  if (loading || authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-panel sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
                ResearchAI
              </span>
              <span className="opacity-30">/</span>
              <h1 className="text-sm font-semibold truncate max-w-xs opacity-80">
                {project.title === "Untitled Research" ? project.research_topic : project.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* Consistency badge in header */}
              {consistency && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  consistency.passed
                    ? consistency.issues.length === 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {consistency.passed
                    ? consistency.issues.length === 0 ? '✓ Consistent' : `⚠ ${consistency.issues.length} warning(s)`
                    : `✗ ${consistency.issues.filter(i => i.severity === 'error').length} error(s)`}
                </span>
              )}
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize
                ${project.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  project.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                {project.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar: nav + health panel */}
        <aside className="w-full md:w-64 shrink-0">
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            projectStatus={project.status}
          />
          <ProjectHealth
            projectId={id}
            consistency={consistency}
            evaluation={evaluation}
            loadingConsistency={loadingConsistency}
            loadingEvaluation={loadingEvaluation}
            onRunConsistency={() => runConsistencyCheck(researchContext)}
            onRunEvaluation={handleRunEvaluation}
          />
        </aside>

        {/* Workspace panel */}
        <section className="flex-1 min-h-0">
          <div className="glass-panel rounded-2xl p-6 md:p-8 min-h-[calc(100vh-10rem)]">
            {activeTab === "idea" && <IdeaBuilder project={project} />}
            {activeTab === "structure" && <Structure project={project} />}
            {activeTab === "methodology" && <Methodology project={project} />}
            {activeTab === "review" && <SupervisorCheck project={project} />}
          </div>
        </section>
      </main>
    </div>
  );
}
