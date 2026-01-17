// User Profile Types
export interface UserProfile {
  id: string
  userId: string
  name: string
  email: string
  education: string
  experience: string
  contactInfo: string
  interests: string[]
  targetSectors: string[]
  targetRoles: string[]
  resumeUrl?: string
  resumeParsedData?: ResumeParsedData
  avatar?: string
  createdAt: number
  updatedAt: number
}

export interface ResumeParsedData {
  name: string
  email: string
  phone?: string
  skills: string[]
  experience: Array<{
    title: string
    company: string
    duration: string
  }>
  education: Array<{
    degree: string
    school: string
  }>
}

// Map Types
export interface Booth {
  id: string
  name: string
  companyName: string
  description: string
  latitude: number
  longitude: number
  tags: string[]
  keyPeople: Person[]
  summary?: string // AI-generated summary based on user resume
}

export interface Person {
  id: string
  name: string
  role: string
  company: string
  bio: string
  image?: string
  expertise: string[]
}

// Chat Types
export interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  content: string
  timestamp: number
  audioUrl?: string
}

export interface ChatSession {
  id: string
  userId: string
  targetPerson: Person | Booth
  sessionType: 'practice' | 'exploration' // practice for specific person/booth, exploration for general
  messages: ChatMessage[]
  startTime: number
  endTime?: number
  recordingUrl?: string
}

// Analytics Types
export interface BoothVisit {
  userId: string
  boothId: string
  startTime: number
  endTime: number
  duration: number
}

// Form Types
export interface ProfileFormData {
  name: string
  education: string
  experience: string
  contactInfo: string
  interests: string[]
  targetSectors: string[]
  targetRoles: string[]
}
