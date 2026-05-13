"use client";

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { apiService } from '@/services/api';
import type { OutputType } from '@/models';

export function useAI(projectId: string, type: OutputType) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadExisting = useCallback(async () => {
    if (!projectId) return;
    const { data } = await supabase
      .from('research_outputs')
      .select('content')
      .eq('project_id', projectId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data?.content) {
      setResult(typeof data.content === 'string' ? JSON.parse(data.content) : data.content);
    }
  }, [projectId, type]);

  const saveOutput = useCallback(async (data: any) => {
    if (!projectId) return;
    await supabase.from('research_outputs').insert({
      project_id: projectId,
      type,
      content: data,
    });
    // Also bump project status to 'in_progress'
    await supabase.from('projects').update({ status: 'in_progress' }).eq('id', projectId);
  }, [projectId, type]);

  const generate = useCallback(async (apiFn: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFn();
      setResult(data);
      await saveOutput(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [saveOutput]);

  return { loading, result, error, generate, loadExisting, setResult };
}
