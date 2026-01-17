// User Profile Types
export const UserProfileSchema = {
  id: 'string',
  userId: 'string',
  name: 'string',
  email: 'string',
  education: 'string',
  experience: 'string',
  contactInfo: 'string',
  interests: 'string[]',
  targetSectors: 'string[]',
  targetRoles: 'string[]',
  resumeUrl: 'string?',
  resumeParsedData: 'ResumeParsedData?',
  avatar: 'string?',
  createdAt: 'number',
  updatedAt: 'number',
}

export const ResumeParsedDataSchema = {
  name: 'string',
  email: 'string',
  phone: 'string?',
  skills: 'string[]',
  experience: 'Array<{title: string, company: string, duration: string}>',
  education: 'Array<{degree: string, school: string}>',
}

// Map Types
export const BoothSchema = {
  id: 'string',
  name: 'string',
  companyName: 'string',
  description: 'string',
  latitude: 'number',
  longitude: 'number',
  tags: 'string[]',
  keyPeople: 'Person[]',
  summary: 'string?',
}

export const PersonSchema = {
  id: 'string',
  name: 'string',
  role: 'string',
  company: 'string',
  bio: 'string',
  image: 'string?',
  expertise: 'string[]',
}

// Chat Types
export const ChatMessageSchema = {
  id: 'string',
  sender: 'user|ai',
  content: 'string',
  timestamp: 'number',
  audioUrl: 'string?',
}

export const ChatSessionSchema = {
  id: 'string',
  userId: 'string',
  targetPerson: 'Person|Booth',
  sessionType: 'practice|exploration',
  messages: 'ChatMessage[]',
  startTime: 'number',
  endTime: 'number?',
  recordingUrl: 'string?',
}

// Analytics Types
export const BoothVisitSchema = {
  userId: 'string',
  boothId: 'string',
  startTime: 'number',
  endTime: 'number',
  duration: 'number',
}

// Form Types
export const ProfileFormDataSchema = {
  name: 'string',
  education: 'string',
  experience: 'string',
  contactInfo: 'string',
  interests: 'string[]',
  targetSectors: 'string[]',
  targetRoles: 'string[]',
}
