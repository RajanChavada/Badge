import { create } from 'zustand'
import type { UserProfile, Booth, ChatSession, BoothVisit } from '../types'

interface AppStore {
  // User
  userProfile: UserProfile | null
  setUserProfile: (profile: UserProfile) => void
  
  // Booths
  booths: Booth[]
  selectedBooth: Booth | null
  setBooths: (booths: Booth[]) => void
  setSelectedBooth: (booth: Booth | null) => void
  
  // Chat
  currentChatSession: ChatSession | null
  setCurrentChatSession: (session: ChatSession | null) => void
  
  // Analytics
  boothVisits: BoothVisit[]
  addBoothVisit: (visit: BoothVisit) => void
  
  // UI
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  error: string | null
  setError: (error: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
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
