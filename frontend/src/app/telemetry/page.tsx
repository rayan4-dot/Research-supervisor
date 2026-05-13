"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function TelemetryDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('event_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_logs' }, (payload) => {
        setLogs(prev => [payload.new, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = {
    total: logs.length,
    retrievals: logs.filter(l => l.event_type === 'RAG_RETRIEVAL').length,
    failures: logs.filter(l => l.event_type === 'VALIDATION_FAIL').length,
    avgSimilarity: logs
      .filter(l => l.event_type === 'RAG_RETRIEVAL' && l.details?.top_similarity)
      .reduce((acc, curr) => acc + curr.details.top_similarity, 0) / (logs.filter(l => l.event_type === 'RAG_RETRIEVAL' && l.details?.top_similarity).length || 1)
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Reasoning Analytics</h1>
            <p className="text-slate-500 mt-1">Real-time monitoring of RAG retrieval and AI health.</p>
          </div>
          <Link href="/" className="btn-secondary px-4 py-2 rounded-xl text-sm">
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Events" value={stats.total} icon="📊" />
          <StatCard label="RAG Retrievals" value={stats.retrievals} icon="📚" color="text-blue-500" />
          <StatCard label="Validation Fails" value={stats.failures} icon="⚠️" color="text-amber-500" />
          <StatCard label="Avg Similarity" value={`${Math.round(stats.avgSimilarity * 100)}%`} icon="🎯" color="text-emerald-500" />
        </div>

        {/* Events List */}
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <h2 className="font-bold text-sm uppercase tracking-wider opacity-50">Live Event Feed</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase">Live</span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <div className="p-20 text-center animate-pulse opacity-50">Loading telemetry data...</div>
            ) : logs.length === 0 ? (
              <div className="p-20 text-center opacity-30 italic">No events recorded yet.</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <EventBadge type={log.event_type} />
                      <div>
                        <p className="text-sm font-semibold">
                          {log.event_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-[10px] opacity-40 uppercase font-mono">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-3 ml-11 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                      <pre className="whitespace-pre-wrap font-mono opacity-80 overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color = "" }: any) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs font-bold uppercase tracking-wider opacity-40 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function EventBadge({ type }: { type: string }) {
  const styles: any = {
    RAG_RETRIEVAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    VALIDATION_FAIL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    VALIDATION_PASS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    AI_RETRY: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    LOW_EVALUATION_SCORE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const defaultStyle = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
  
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${styles[type] || defaultStyle}`}>
      <span className="text-lg">
        {type === 'RAG_RETRIEVAL' && '📚'}
        {type === 'VALIDATION_FAIL' && '⚠️'}
        {type === 'VALIDATION_PASS' && '✅'}
        {type === 'AI_RETRY' && '⟳'}
        {type === 'LOW_EVALUATION_SCORE' && '📊'}
        {!styles[type] && '•'}
      </span>
    </div>
  );
}
