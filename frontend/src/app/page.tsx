"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ProjectCard, StatsCard } from "@/components/Cards";
import Editor from "@/components/Editor";
import { useAuth } from "@/hooks/useAuth";
import type { Project } from "@/models";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [topic, setTopic] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    async function loadProjects() {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (data) setProjects(data);
      setLoadingProjects(false);
    }
    loadProjects();
  }, [user]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setIsCreating(true);

    const { data } = await supabase
      .from("projects")
      .insert([{ 
        title: "Untitled Research", 
        research_topic: topic, 
        status: "draft",
        user_id: user?.id 
      }])
      .select()
      .single();

    setIsCreating(false);
    if (data) {
      setProjects([data, ...projects]);
      router.push(`/project/${data.id}`);
    } else {
      alert("Failed to create project. Check your Supabase configuration in .env");
    }
  };

  const draftCount = projects.filter((p) => p.status === "draft").length;
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;
  const completedCount = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="glass-panel border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
              ResearchAI
            </span>
            <span className="hidden sm:inline text-xs opacity-40">Moroccan University Research Supervisor</span>
          </div>
          {user && (
            <div className="flex items-center gap-6 text-sm">
              <Link href="/telemetry" className="opacity-70 hover:opacity-100 hover:text-primary transition-all font-medium flex items-center gap-1.5">
                <span>📊</span> Analytics
              </Link>
              <Link href="/profile" className="opacity-70 hover:opacity-100 hover:text-primary transition-all font-medium flex items-center gap-2">
                <span>👤</span> {user.email}
              </Link>
              <button onClick={signOut} className="text-red-500 hover:text-red-400 opacity-80 font-medium">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {authLoading ? (
          <div className="flex justify-center py-20"><span className="animate-spin text-3xl opacity-50">⟳</span></div>
        ) : (
          <>
            {/* Hero */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-indigo-500">
            AI Research Supervisor
          </h1>
          <p className="text-lg opacity-50 max-w-xl mx-auto">
            Turn a vague research idea into a structured, academically valid thesis plan.
          </p>
        </div>

        {/* Stats Row */}
        {projects.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatsCard icon="📁" label="Total Projects" value={projects.length} />
            <StatsCard icon="✏️" label="Drafts" value={draftCount} />
            <StatsCard icon="🔄" label="In Progress" value={inProgressCount} />
            <StatsCard icon="✅" label="Completed" value={completedCount} />
          </div>
        )}

        {/* Main grid */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Create Panel */}
          <div className="md:col-span-2">
            <div className="glass-panel rounded-2xl p-6 space-y-5 sticky top-20">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>✨</span> New Research Project
                </h2>
                <p className="text-sm opacity-50 mt-1">Start from a topic — even a vague one.</p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                <Editor
                  label="Research Topic"
                  value={topic}
                  onChange={setTopic}
                  placeholder="e.g. Digital transformation in Moroccan banking sector..."
                  minHeight="130px"
                  hint="The AI will refine and structure it for you."
                />
                <button
                  type="submit"
                  disabled={isCreating || !topic.trim()}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <><span className="animate-spin">⟳</span> Creating...</>
                  ) : (
                    <>Start Project →</>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Project List */}
          <div className="md:col-span-3 space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>📚</span> Your Projects
            </h2>
            {loadingProjects ? (
              <div className="flex items-center justify-center h-40 opacity-30">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : projects.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center opacity-40 space-y-2">
                <p className="text-3xl">🎓</p>
                <p className="text-sm">No projects yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
