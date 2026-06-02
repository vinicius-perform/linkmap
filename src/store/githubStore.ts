import { create } from 'zustand';

interface GithubState {
  token: string | null;
  setToken: (token: string | null) => void;
}

export const useGithubStore = create<GithubState>((set) => ({
  // Load initial token from localStorage if available (client-side only)
  token: typeof window !== 'undefined' ? localStorage.getItem('github_pat') : null,
  setToken: (token) => {
    if (token) {
      localStorage.setItem('github_pat', token);
    } else {
      localStorage.removeItem('github_pat');
    }
    set({ token });
  },
}));
