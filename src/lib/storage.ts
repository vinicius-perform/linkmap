import localforage from 'localforage';
import { Project } from '@/types/project';
import { supabase, isSupabaseConfigured } from './supabase';

// Initialize localforage store
localforage.config({
  name: 'LinkMapStudio',
  storeName: 'projects',
});

export const getProjects = async (): Promise<Project[]> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (error) throw error;
      return (data || []) as Project[];
    } catch (err) {
      console.error('Error fetching projects from Supabase:', err);
      // Fallback to localforage
    }
  }

  try {
    const projects: Project[] = [];
    await localforage.iterate((value: Project) => {
      projects.push(value);
    });
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Error fetching projects from localforage:', err);
    return [];
  }
};

export const getProject = async (id: string): Promise<Project | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      return data as Project;
    } catch (err) {
      console.error('Error fetching project from Supabase:', err);
      // Fallback to localforage
    }
  }

  try {
    return await localforage.getItem<Project>(id);
  } catch (err) {
    console.error('Error fetching project from localforage:', err);
    return null;
  }
};

export const saveProject = async (project: Project): Promise<void> => {
  project.updatedAt = Date.now();

  // Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('projects')
        .upsert({
          id: project.id,
          name: project.name,
          slug: project.slug,
          imageBase64: project.imageBase64,
          hotspots: project.hotspots,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          githubUrl: project.githubUrl || null,
          githubRepo: project.githubRepo || null,
          githubUpdatedAt: project.githubUpdatedAt || null,
          vercelUrl: project.vercelUrl || null,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving project to Supabase:', err);
      // Fallback: we still save to localforage even if Supabase fails
    }
  }

  try {
    await localforage.setItem(project.id, project);
  } catch (err) {
    console.error('Error saving project to localforage:', err);
    throw err;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error deleting project from Supabase:', err);
    }
  }

  try {
    await localforage.removeItem(id);
  } catch (err) {
    console.error('Error deleting project from localforage:', err);
    throw err;
  }
};
