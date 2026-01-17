import { create } from 'zustand'

export const useAppStore = create((set) => ({
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  booths: [],
  selectedBooth: null,
  setBooths: (booths) => set({ booths }),
  setSelectedBooth: (booth) => set({ selectedBooth: booth }),
  
  currentChatSession: null,
  setCurrentChatSession: (session) => set({ currentChatSession: session }),
  
  boothVisits: [],
  addBoothVisit: (visit) =>
    set((state) => ({
      boothVisits: [...state.boothVisits, visit],
    })),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  error: null,
  setError: (error) => set({ error }),
}))
