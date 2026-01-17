# Badge - Networking App

A comprehensive web application for networking at career fairs, hackathons, and conferences. Features an interactive map, AI-powered chat practice, resume parsing, and personalized recommendations.

## Features

### 🗺️ Interactive Map
- **Static Event Map**: Visualize all booths and companies at the event
- **Booth Listings**: Browse all participating companies with descriptions
- **Location Filtering**: Filter booths by interests/tags (AI/ML, Web Dev, Cloud, etc.)
- **Geolocation Tracking**: Track user location and time spent at each booth with Amplitude analytics
- **Key People Directories**: View recruiters and professionals at each booth
- **Personalized Summaries**: AI-generated booth summaries based on user's resume and interests

### 👤 User Profile
- **Resume Upload & Parsing**: Upload resume (PDF/DOC) with automatic parsing to extract:
  - Skills
  - Work experience
  - Education
  - Contact information
- **Personal Details**: Add name, education, experience, and contact info
- **Interests Selection**: Choose from predefined interests and skills
- **Target Sectors**: Select industries of interest
- **Roles Sought**: Specify desired job roles

### 💬 Networking Practice Chat
- **AI-Powered Conversations**: Practice pitches and networking approaches with AI
- **Voice Interface**: Optional audio/voice input and output
- **Multiple Session Types**:
  - **Practice Mode**: Focused conversation with a specific person or booth
  - **Explore Mode**: General learning and topic exploration
- **Contextual AI Responses**: Responses consider:
  - User's resume and background
  - Target person/booth information
  - Conversation history
  - Professional best practices

### 📊 Dashboard
- **Stats Overview**: View booths visited, active connections, practice sessions completed
- **Quick Actions**: Fast access to profile, map, and chat features
- **Personalized Recommendations**: Booths and companies recommended based on profile

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** - Fast build tool
- **React Router** - Navigation
- **Zustand** - State management
- **Lucide React** - Icons
- **Leaflet/React-Leaflet** - Map components (prepared)
- **React Hook Form & Zod** - Form handling and validation

### Backend & Services (To be Integrated)
- **Convex** - Backend database and API
- **Clerk** - Authentication
- **Amplitude** - Analytics and tracking
- **OpenAI/Claude** - AI conversations
- **Speech-to-Text API** - Audio transcription (Whisper, Azure, etc.)
- **Text-to-Speech API** - Audio generation
- **Resume Parsing Service** - Extract resume data

## Project Structure

```
src/
├── components/
│   ├── Navigation.tsx       # Main navigation bar
│   └── Navigation.css
├── pages/
│   ├── Dashboard.tsx        # Main dashboard
│   ├── Dashboard.css
│   ├── Profile.tsx          # User profile & resume upload
│   ├── Profile.css
│   ├── Map.tsx              # Interactive event map
│   ├── Map.css
│   ├── ChatInterface.tsx    # AI chat for networking practice
│   └── ChatInterface.css
├── store/
│   └── useAppStore.ts       # Zustand global state
├── services/
│   └── api.ts               # API integration layer (with TODO markers)
├── types/
│   └── index.ts             # TypeScript type definitions
├── App.tsx                  # Main app component with routing
├── App.css
├── main.tsx                 # React entry point
└── index.css                # Global styles
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Clerk account (for authentication)
- Convex account (for backend)

### Installation

1. Clone the repository and navigate to the project:
```bash
cd badge-app
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Fill in the following:
- `VITE_CLERK_PUBLISHABLE_KEY` - Get from Clerk dashboard
- `VITE_CONVEX_URL` - Get from Convex deployment
- `VITE_AMPLITUDE_API_KEY` - Get from Amplitude
- Other API keys for AI services

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run ESLint
npm run lint
```

## Key Pages & Features

### Dashboard (`/dashboard`)
- Overview of networking activity
- Stats: booths visited, connections, practice sessions
- Quick action buttons
- Personalized recommendations

### Profile (`/profile`)
- Resume upload with automatic parsing
- Personal details form
- Multi-select interests, sectors, and target roles
- View and edit profile information

### Map (`/map`)
- Interactive SVG map of event booths
- Search and filter booths by interest/tag
- Click booths to view details
- See key people at each booth
- Get AI-personalized booth summaries
- Sidebar with booth listings
- Geolocation tracking info

### Chat (`/chat`)
- Create new practice or exploration sessions
- Start conversation with AI-simulated professionals
- Voice input/output support (microphone button)
- View chat history
- Tips section for networking best practices

## Backend Integration (TODO)

The app is structured to integrate with various backend services. Key integration points are marked with `TODO:` comments in `/src/services/api.ts`:

1. **Convex Backend**
   - User profile CRUD
   - Booth data management
   - Chat session storage
   - Analytics data

2. **Resume Parsing**
   - Implement resume upload to Convex storage
   - Call AI resume parsing service
   - Extract and store parsed data

3. **AI Services**
   - Generate contextual chat responses
   - Create personalized booth summaries
   - Speech-to-text conversion
   - Text-to-speech conversion

4. **Analytics**
   - Integrate Amplitude for booth visit tracking
   - Track geolocation and time spent
   - Generate recommendations based on behavior

5. **Authentication**
   - Clerk is already integrated in main.tsx
   - User is redirected to sign-in if not authenticated

## Data Models

See `/src/types/index.ts` for complete type definitions:

- **UserProfile** - User information, resume data, preferences
- **Booth** - Event booth details, key people, tags
- **Person** - Recruiter/professional information
- **ChatSession** - Chat conversation with AI
- **ChatMessage** - Individual messages in chat
- **BoothVisit** - Analytics for booth visit tracking

## Styling

- **Color Scheme**:
  - Primary: `#667eea` (purple-blue)
  - Secondary: `#764ba2` (purple)
  - Accent: `#4facfe` (bright blue)
  - Backgrounds: `#f8f9fa` (light gray)

- **Responsive Design**: Mobile-first approach with breakpoints at 768px and 1024px
- **Component-level CSS**: Each component has its own CSS file for maintainability

## Future Enhancements

1. Real-time notifications for new messages/connections
2. Video chat capability for interviews
3. Resume analysis dashboard showing skill matches
4. LinkedIn/social media integration
5. Post-event networking summaries
6. Connection management and follow-up tracking
7. Event feedback and analytics
8. Mobile app (React Native)

## Contributing

This is a frontend-focused UI implementation. When adding backend features:

1. Add corresponding types to `/src/types/index.ts`
2. Add API calls to `/src/services/api.ts`
3. Update Zustand store in `/src/store/useAppStore.ts` if needed
4. Update components to use new data/functions

## License

MIT

## Support

For issues or questions, please refer to the inline TODO comments in the codebase for implementation guidance.
