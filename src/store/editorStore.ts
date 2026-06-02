import { create } from 'zustand';
import { Project, Hotspot } from '@/types/project';

interface EditorState {
  project: Project | null;
  selectedHotspotId: string | null;
  isTestMode: boolean;
  setProject: (project: Project | null) => void;
  updateProjectInfo: (info: Partial<Project>) => void;
  setSelectedHotspotId: (id: string | null) => void;
  setTestMode: (isTestMode: boolean) => void;
  addHotspot: (hotspot: Hotspot) => void;
  updateHotspot: (id: string, data: Partial<Hotspot>) => void;
  deleteHotspot: (id: string) => void;
  duplicateHotspot: (id: string) => void;
  centerHotspot: (id: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  project: null,
  selectedHotspotId: null,
  isTestMode: false,
  
  setProject: (project) => set({ project }),
  
  updateProjectInfo: (info) => set((state) => ({
    project: state.project ? { ...state.project, ...info } : null
  })),

  setSelectedHotspotId: (id) => set({ selectedHotspotId: id }),
  
  setTestMode: (isTestMode) => set({ isTestMode, selectedHotspotId: null }),

  addHotspot: (hotspot) => set((state) => ({
    project: state.project ? {
      ...state.project,
      hotspots: [...state.project.hotspots, hotspot]
    } : null
  })),

  updateHotspot: (id, data) => set((state) => ({
    project: state.project ? {
      ...state.project,
      hotspots: state.project.hotspots.map(h => 
        h.id === id ? { ...h, ...data } : h
      )
    } : null
  })),

  deleteHotspot: (id) => set((state) => ({
    project: state.project ? {
      ...state.project,
      hotspots: state.project.hotspots.filter(h => h.id !== id)
    } : null,
    selectedHotspotId: state.selectedHotspotId === id ? null : state.selectedHotspotId
  })),

  duplicateHotspot: (id) => set((state) => {
    if (!state.project) return state;
    const hotspotToDuplicate = state.project.hotspots.find(h => h.id === id);
    if (!hotspotToDuplicate) return state;

    const newHotspot = {
      ...hotspotToDuplicate,
      id: crypto.randomUUID(),
      name: `${hotspotToDuplicate.name} (Cópia)`,
      x: Math.min(hotspotToDuplicate.x + 5, 100 - hotspotToDuplicate.width),
      y: Math.min(hotspotToDuplicate.y + 5, 100 - hotspotToDuplicate.height),
    };

    return {
      project: {
        ...state.project,
        hotspots: [...state.project.hotspots, newHotspot]
      },
      selectedHotspotId: newHotspot.id
    };
  }),

  centerHotspot: (id) => set((state) => {
    if (!state.project) return state;
    return {
      project: {
        ...state.project,
        hotspots: state.project.hotspots.map(h => {
          if (h.id !== id) return h;
          return {
            ...h,
            x: 50 - (h.width / 2),
            y: 50 - (h.height / 2),
          };
        })
      }
    };
  }),
}));
