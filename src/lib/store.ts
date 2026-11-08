/**
 * CALCORA Global Store
 * Manages: navigation (which calculator is open), calculation history,
 * favorites, recently used, multi-calc workspace, share state.
 * All persisted to localStorage — no account required.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  id: string;
  expr: string;
  result: string;
  ts: number;
  pinned?: boolean;
  mode?: string;
  sessionId?: string;
}

export interface CalcState {
  // Navigation
  activeCalcId: string;
  activeView: "home" | "calculator" | "directory" | "about" | "privacy" | "terms";
  setView: (v: CalcState["activeView"]) => void;
  openCalc: (id: string) => void;
  goHome: () => void;

  // History
  history: HistoryEntry[];
  addHistory: (e: Omit<HistoryEntry, "id" | "ts">) => void;
  removeHistory: (id: string) => void;
  pinHistory: (id: string, pinned: boolean) => void;
  clearHistory: () => void;
  renameHistorySession: (id: string, sessionId: string) => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (id: string) => void;

  // Recent
  recent: string[];
  pushRecent: (id: string) => void;

  // Share dialog
  shareOpen: boolean;
  shareData: { expr: string; result: string; explanation?: string } | null;
  openShare: (data: { expr: string; result: string; explanation?: string }) => void;
  closeShare: () => void;

  // Sidebar (mobile)
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
}

export const useCalc = create<CalcState>()(
  persist(
    (set, get) => ({
      activeCalcId: "universal",
      activeView: "home",
      setView: (v) => set({ activeView: v, sidebarOpen: false }),
      openCalc: (id) => {
        const { recent } = get();
        const newRecent = [id, ...recent.filter(r => r !== id)].slice(0, 8);
        set({ activeCalcId: id, activeView: "calculator", recent: newRecent, sidebarOpen: false });
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      },
      goHome: () => set({ activeView: "home", sidebarOpen: false }),

      history: [],
      addHistory: (e) => set((s) => ({
        history: [{ ...e, id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, ts: Date.now() }, ...s.history].slice(0, 200),
      })),
      removeHistory: (id) => set((s) => ({ history: s.history.filter(h => h.id !== id) })),
      pinHistory: (id, pinned) => set((s) => ({ history: s.history.map(h => h.id === id ? { ...h, pinned } : h) })),
      clearHistory: () => set({ history: [] }),
      renameHistorySession: (id, sessionId) => set((s) => ({ history: s.history.map(h => h.id === id ? { ...h, sessionId } : h) })),

      favorites: [],
      toggleFavorite: (id) => set((s) => ({
        favorites: s.favorites.includes(id)
          ? s.favorites.filter(f => f !== id)
          : [...s.favorites, id],
      })),

      recent: [],
      pushRecent: (id) => set((s) => ({
        recent: [id, ...s.recent.filter(r => r !== id)].slice(0, 8),
      })),

      shareOpen: false,
      shareData: null,
      openShare: (data) => set({ shareOpen: true, shareData: data }),
      closeShare: () => set({ shareOpen: false, shareData: null }),

      sidebarOpen: false,
      setSidebarOpen: (o) => set({ sidebarOpen: o }),
    }),
    {
      name: "calcora-store",
      partialize: (s) => ({
        history: s.history,
        favorites: s.favorites,
        recent: s.recent,
      }),
    },
  ),
);
