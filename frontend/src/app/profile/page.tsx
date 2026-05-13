"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { Project } from "@/models";

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

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
        .eq("user_id", user!.id);
      if (data) setProjects(data);
      setLoadingProjects(false);
    }
    loadProjects();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const completedCount = projects.filter((p) => p.status === "completed").length;
  const inProgressCount = projects.filter((p) => p.status === "in_progress").length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0c10]">
      {/* Header */}
      <header className="glass-panel border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
            <span>←</span> Back to Dashboard
          </Link>
          <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500">
            Profile & Ownership
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* User Card */}
        <div className="glass-panel rounded-2xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 rounded-full bg-primary/10 blur-3xl mix-blend-screen" />
          
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl text-white font-bold shrink-0">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold">{user.email}</h1>
            <p className="text-sm opacity-50 mt-1">
              Member since {new Date(user.created_at).toLocaleDateString()}
            </p>
            <div className="mt-4 inline-block">
              <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800/30">
                Active Scholar Account
              </span>
            </div>
          </div>
          <div className="shrink-0 mt-4 sm:mt-0">
            <button onClick={signOut} className="btn-secondary px-6 py-2.5 rounded-xl text-sm font-medium border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-900/20">
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Research Statistics */}
          <div className="glass-panel rounded-2xl p-8 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-bold">Research Statistics</h2>
            </div>
            
            {loadingProjects ? (
              <p className="opacity-50 text-sm">Loading data...</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                  <span className="text-sm font-medium opacity-70">Total Projects</span>
                  <span className="text-xl font-bold">{projects.length}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-400">In Progress</span>
                  <span className="text-xl font-bold text-blue-700 dark:text-blue-400">{inProgressCount}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/10 rounded-xl">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">Completed</span>
                  <span className="text-xl font-bold text-green-700 dark:text-green-400">{completedCount}</span>
                </div>
              </div>
            )}
          </div>

          {/* Intellectual Property & Ownership */}
          <div className="glass-panel rounded-2xl p-8 border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-transparent to-primary/5">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⚖️</span>
              <h2 className="text-xl font-bold">Intellectual Property</h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed opacity-80">
              <p>
                As a user of the <strong>AI Research Supervisor</strong>, you retain <strong className="text-primary">100% ownership</strong> and intellectual property rights over all research ideas, structures, and content generated within your account.
              </p>
              <p>
                The AI acts purely as a structural and methodological assistant. Your data is isolated in your private workspace and is not used to train global AI models.
              </p>
              <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-xl text-xs font-medium text-primary">
                ✓ Private Workspace <br/>
                ✓ 100% IP Retention <br/>
                ✓ Moroccan University Standards Compliance
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
