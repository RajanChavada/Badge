import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAppStore = create(
  persist(
    (set) => ({
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
      
      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'badge-app-storage',
      partialize: (state) => ({ darkMode: state.darkMode }),
    }
  )
)

export default useAppStore
