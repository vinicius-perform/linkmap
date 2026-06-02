import localforage from 'localforage';
import { Project } from '@/types/project';

// Initialize localforage store
localforage.config({
  name: 'LinkMapStudio',
  storeName: 'projects',
});

export const getProjects = async (): Promise<Project[]> => {
  try {
    const projects: Project[] = [];
    await localforage.iterate((value: Project) => {
      projects.push(value);
    });
    // Sort by most recently updated
    return projects.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (err) {
    console.error('Error fetching projects:', err);
    return [];
  }
};

export const getProject = async (id: string): Promise<Project | null> => {
  try {
    return await localforage.getItem<Project>(id);
  } catch (err) {
    console.error('Error fetching project:', err);
    return null;
  }
};

export const saveProject = async (project: Project): Promise<void> => {
  try {
    project.updatedAt = Date.now();
    await localforage.setItem(project.id, project);
  } catch (err) {
    console.error('Error saving project:', err);
    throw err;
  }
};

export const deleteProject = async (id: string): Promise<void> => {
  try {
    await localforage.removeItem(id);
  } catch (err) {
    console.error('Error deleting project:', err);
    throw err;
  }
};
