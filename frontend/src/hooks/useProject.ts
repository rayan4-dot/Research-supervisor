"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/models';

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (data) setProject(data);
      else setError(error?.message || 'Project not found');
      setLoading(false);
    }
    load();
  }, [id]);

  const updateStatus = async (status: Project['status']) => {
    if (!project) return;
    const { data } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', project.id)
      .select()
      .single();
    if (data) setProject(data);
  };

  return { project, loading, error, updateStatus };
}
