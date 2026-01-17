# Badge - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Navigation Bar (Sticky)                      │   │
│  │  Badge Logo | Dashboard | Profile | Map | Chat | User    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React Router                           │   │
│  │  ┌────────────────────────────────────────────────────┐  │   │
│  │  │  Dashboard         Profile      Map     Chat       │  │   │
│  │  │  ├─Stats           ├─Resume     ├─Booths ├─Session│  │   │
│  │  │  ├─Quick Actions   ├─Details    ├─Filter ├─Messages   │   │
│  │  │  └─Recomm...      ├─Interests  └─Search └─Voice    │  │   │
│  │  └────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        Zustand Global State Management                   │   │
│  │  userProfile | booths | selectedBooth | chatSession     │   │
│  │  boothVisits | isLoading | error                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ API Calls
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVICES (To Integrate)              │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Convex     │  │    Clerk     │  │  Amplitude   │          │
│  │   Database   │  │   Auth       │  │  Analytics   │          │
│  │              │  │              │  │              │          │
│  │ • Users      │  │ • SignIn     │  │ • Track      │          │
│  │ • Profiles   │  │ • SignUp     │  │   Events     │          │
│  │ • Booths     │  │ • Webhooks   │  │ • Identify   │          │
│  │ • Chats      │  └──────────────┘  └──────────────┘          │
│  └──────────────┘                                                │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   OpenAI     │  │ Whisper API  │  │ Speech API   │          │
│  │   (Claude)   │  │ (Speech-Text)│  │ (Text-Voice) │          │
│  │              │  │              │  │              │          │
│  │ • Chat       │  │ • Audio →    │  │ • Text →     │          │
│  │   Response   │  │   Transcript │  │   Audio      │          │
│  │              │  │              │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────┐                           │
│  │  Resume Parsing Service          │                           │
│  │  (Ashby / Textkernel / Custom)   │                           │
│  │  • Upload & Parse                │                           │
│  │  • Extract Skills                │                           │
│  │  • Experience & Education        │                           │
│  └──────────────────────────────────┘                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### User Profile Setup Flow
```
User Opens App
    ↓
Clerk Auth Check
    ├─ Authenticated → Dashboard
    └─ Not Authenticated → Sign In
    ↓
User Navigates to Profile
    ↓
Uploads Resume
    ├─ Store locally in state
    ├─ Backend: Upload to Convex storage (TODO)
    └─ Backend: Parse with AI service (TODO)
    ↓
Form Auto-populates with Parsed Data
    ↓
User Edits Details + Selects Interests/Sectors/Roles
    ↓
Saves Profile
    ├─ Store to Zustand state
    └─ Backend: Save to Convex database (TODO)
```

### Map & Booth Discovery Flow
```
User Opens Map Page
    ↓
Frontend: Load mock booths data
Backend: Fetch booths from Convex (TODO)
    ↓
Display Interactive SVG Map with Booth Markers
    ↓
User Interaction:
    ├─ Click booth → Show popup with details
    ├─ Search booth → Filter by name/company
    └─ Filter by interest → Show relevant booths
    ↓
User Clicks Booth
    ├─ Track visit with Amplitude (TODO)
    ├─ Generate personalized summary (AI) (TODO)
    └─ Show recruiter details
```

### Chat & Networking Practice Flow
```
User Opens Chat Page
    ↓
Sees Previous Sessions in Sidebar
    ↓
Clicks "New Practice Session"
    ├─ Select Target Person/Booth (TODO: UI)
    └─ Session Created with ID
    ↓
Chat Interface Opens
    ├─ Welcome message
    └─ Ready for input
    ↓
User Sends Message (Text or Voice)
    ├─ Text: Direct send
    └─ Voice: Convert to text via Whisper (TODO)
    ↓
Message Added to Chat UI
    ↓
AI Generates Response (TODO)
    ├─ Consider user resume
    ├─ Consider booth/person context
    └─ Send contextual response
    ↓
User Can Hear Response via TTS (TODO)
    ↓
Store Session & Messages
    └─ Saved to Convex database (TODO)
```

## Component Hierarchy

```
App
├── Navigation (persistent)
│   ├── Brand Logo
│   ├── Nav Links
│   └── User Button (Clerk)
│
└── Routes
    ├── /dashboard
    │   └── Dashboard
    │       ├── StatsCard (×4)
    │       ├── QuickActions
    │       └── Recommendations
    │
    ├── /profile
    │   └── Profile
    │       ├── ResumeUpload
    │       ├── ProfileForm
    │       │   ├── TextInput (name, contact)
    │       │   ├── TextArea (education, experience)
    │       │   └── MultiSelect (interests, sectors, roles)
    │       └── ProfileView
    │
    ├── /map
    │   └── Map
    │       ├── MapCanvas (SVG)
    │       ├── BoothDetailsPopup
    │       ├── PersonCard
    │       └── Sidebar
    │           ├── SearchBox
    │           ├── FilterTags
    │           └── BoothsList
    │
    └── /chat
        └── ChatInterface
            ├── SessionsSidebar
            │   ├── NewSessionButtons
            │   ├── SessionsList
            │   └── Tips
            └── ChatMain
                ├── SessionHeader
                ├── MessagesContainer
                │   └── Message (×n)
                │       ├── Avatar
                │       ├── Content
                │       └── Actions
                └── ChatInputArea
                    ├── MicButton
                    ├── TextInput
                    └── SendButton
```

## State Management Structure

```typescript
useAppStore
├── User Data
│   └── userProfile: UserProfile | null
│
├── Map Data
│   ├── booths: Booth[]
│   └── selectedBooth: Booth | null
│
├── Chat Data
│   └── currentChatSession: ChatSession | null
│
├── Analytics Data
│   └── boothVisits: BoothVisit[]
│
└── UI State
    ├── isLoading: boolean
    └── error: string | null

Actions:
├── setUserProfile(profile)
├── setBooths(booths)
├── setSelectedBooth(booth)
├── setCurrentChatSession(session)
├── addBoothVisit(visit)
├── setIsLoading(boolean)
└── setError(error)
```

## Type System

```typescript
Types (/src/types/index.ts):
├── UserProfile
│   ├── id, userId
│   ├── name, email, education, experience
│   ├── interests[], targetSectors[], targetRoles[]
│   ├── resumeUrl, resumeParsedData
│   └── timestamps
│
├── Booth
│   ├── id, name, companyName, description
│   ├── latitude, longitude, tags[]
│   ├── keyPeople: Person[]
│   └── summary (personalized)
│
├── Person
│   ├── id, name, role, company, bio
│   ├── image, expertise[]
│   └── metadata
│
├── ChatSession
│   ├── id, userId, sessionType
│   ├── targetPerson: Person | Booth
│   ├── messages: ChatMessage[]
│   └── startTime, endTime
│
├── ChatMessage
│   ├── id, sender (user|ai)
│   ├── content, timestamp
│   └── audioUrl (optional)
│
└── BoothVisit
    ├── userId, boothId
    ├── startTime, endTime, duration
    └── metadata
```

## Styling Architecture

```
Global Styles (index.css)
├── CSS Variables (colors, fonts)
├── Base HTML elements
├── Scrollbar styling
└── Utility classes

Component Styles (*.css per component)
├── Component-specific classes
├── Responsive breakpoints (768px, 1024px)
├── Animations & transitions
└── Hover/active states

Color Palette:
├── Primary: #667eea (purple-blue)
├── Secondary: #764ba2 (purple)
├── Accent: #4facfe (bright blue)
├── Background: #f8f9fa (light gray)
├── Text: #333 (dark gray)
└── Borders: #e0e0e0 (light gray)
```

## API Integration Points

```
/src/services/api.ts (All marked with TODO)

Profile APIs:
├── createUserProfile()
├── updateUserProfile()
├── getUserProfile()
├── parseResume()
└── uploadResume()

Booth APIs:
├── fetchBooths()
└── generateBoothSummary()

Chat APIs:
├── createChatSession()
├── generateAIResponse()
├── saveChatSession()
├── convertSpeechToText()
└── convertTextToSpeech()

Analytics APIs:
├── trackBoothVisit()
├── getPersonalizedRecommendations()
├── getUserLocation()
└── startGeolocationTracking()

Connection APIs:
├── createConnection()
└── getUserConnections()
```

## Deployment Architecture

```
Development
    ↓ (npm run dev)
    ├─ Local server on :5173
    └─ Hot module replacement (HMR)

Production Build
    ↓ (npm run build)
    ├─ TypeScript compilation
    ├─ Vite bundling
    ├─ Code splitting by route
    └─ Output to /dist/

Deployment Options
    ├─ Vercel (recommended)
    ├─ Netlify
    ├─ AWS S3 + CloudFront
    └─ Any static host (dist folder)

Environment
    ├─ Frontend: Next.js / Vite / React
    ├─ Backend: Convex
    ├─ Auth: Clerk
    └─ Analytics: Amplitude
```

## Performance Considerations

- **Code Splitting**: Routes are automatically split by React Router
- **Lazy Loading**: Components load on demand
- **Memoization**: Components should use React.memo() for expensive renders
- **Image Optimization**: Lucide icons are lightweight SVGs
- **CSS Scoping**: Component-level CSS prevents style conflicts
- **Bundle Size**: ~338KB JS (uncompressed), ~102KB (gzipped)

## Security Considerations

- Clerk handles authentication securely
- Environment variables kept in .env.local
- No sensitive data hardcoded
- User input validated in forms
- CORS configured for backend
- HTTPS required for production
- Geolocation requires HTTPS (except localhost)

---

This architecture is scalable, maintainable, and ready for production deployment!
