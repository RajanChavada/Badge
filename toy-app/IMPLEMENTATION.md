# Badge App - Implementation Guide

## Project Overview

Badge is a comprehensive networking application frontend built with React, Vite, and TypeScript. It provides a complete user interface for career fairs, hackathons, and conferences with the following major features:

1. **Interactive Event Map** - Browse and filter booths
2. **User Profile & Resume Upload** - Setup and maintain networking identity
3. **AI-Powered Practice Chat** - Practice networking conversations
4. **Dashboard & Analytics** - Track progress and get personalized recommendations

## Architecture

### Frontend Architecture
```
App (Router)
├── Navigation (persistent top bar)
├── Route: /dashboard → Dashboard
├── Route: /profile → Profile
├── Route: /map → Map
└── Route: /chat → ChatInterface
```

### State Management
- **Zustand Store** (`useAppStore`) manages:
  - User profile data
  - Current booth selection
  - Chat sessions
  - Booth visit analytics
  - UI loading states

### Component Structure
Each page component includes:
- TypeScript interfaces for local state
- Props drilling minimized via Zustand
- Component-level CSS for encapsulation
- Accessibility considerations

## Implementation Checklist

### Phase 1: Backend Setup (Convex)

- [ ] **Authentication**
  - Set up Clerk integration with Convex
  - Configure webhook for user creation
  - Test sign-in/sign-out flow

- [ ] **Database Schema**
  - Users table
  - UserProfiles table (extends Users)
  - Booths table
  - People table (booth recruiters)
  - ChatSessions table
  - ChatMessages table
  - BoothVisits table (for analytics)

- [ ] **API Functions**
  - Mutations for profile creation/update
  - Queries for fetching booths, user data
  - Mutations for chat session management
  - Functions for analytics (booth visits)

### Phase 2: Resume Parsing

- [ ] **Resume Upload to Storage**
  - Implement Convex file storage for resumes
  - Update `uploadResume()` in `/src/services/api.ts`
  - Add file validation (type, size)

- [ ] **AI Resume Parsing**
  - Choose parsing service (Ashby, Textkernel, or custom ML)
  - Implement `parseResume()` function
  - Extract: name, email, skills, experience, education
  - Store parsed data in UserProfile

- [ ] **Profile Pre-population**
  - Auto-fill form fields from parsed resume
  - Allow user to edit extracted information
  - Save to Convex database

### Phase 3: AI Integration

- [ ] **Chat Responses**
  - Integrate OpenAI API or Claude
  - Implement `generateAIResponse()` with:
    - User profile context (resume, interests)
    - Booth/person information
    - Conversation history
    - Networking best practices prompting
  - Test response quality and context awareness

- [ ] **Voice Features**
  - Implement speech-to-text (Whisper API or Azure)
  - Implement text-to-speech (Google TTS, Azure, or ElevenLabs)
  - Update `convertSpeechToText()` and `convertTextToSpeech()`
  - Handle audio streaming and caching

- [ ] **Personalization**
  - Implement `generateBoothSummary()` 
  - Create AI prompts for personalized summaries
  - Cache summaries in database

### Phase 4: Analytics & Geolocation

- [ ] **Amplitude Integration**
  - Set up Amplitude in environment
  - Implement `trackBoothVisit()` function
  - Track events:
    - Booth visited
    - Time spent at booth
    - Chat session started
    - Profile completed
    - Connections made

- [ ] **Geolocation**
  - Implement `getUserLocation()` function
  - Request permissions from user
  - Implement `startGeolocationTracking()`
  - Calculate proximity to booths
  - Auto-track booth visits

- [ ] **Recommendations**
  - Implement `getPersonalizedRecommendations()`
  - Algorithm based on:
    - Resume skills vs booth tech stack
    - Time spent at similar booths
    - Selected interests/sectors
    - Similar user behavior

### Phase 5: Data Integration

- [ ] **Booth Data**
  - Create/populate booth database
  - Add booth descriptions and tags
  - Upload recruiter information
  - Add booth locations (coordinates for map)

- [ ] **Event Configuration**
  - Make booths/people editable (admin panel)
  - Allow event organizers to manage data
  - Support multiple events

- [ ] **Connections**
  - Implement connection creation (`createConnection()`)
  - Implement follow/unfollow system
  - Track connections in database

### Phase 6: Testing & Optimization

- [ ] **Frontend Testing**
  - Unit tests for components
  - Integration tests for flows
  - E2E tests with user scenarios

- [ ] **Performance**
  - Code splitting by route
  - Image optimization
  - Lazy loading components
  - Database query optimization

- [ ] **Security**
  - Validate resume file types
  - Sanitize user inputs
  - CORS configuration
  - Rate limiting for API calls

## Key API Endpoints to Implement

### Profile Management
```typescript
// POST /api/profile/create
// PUT /api/profile/:userId
// GET /api/profile/:userId
// POST /api/profile/resume/upload
// GET /api/profile/resume/parse
```

### Booth Operations
```typescript
// GET /api/booths
// GET /api/booths/:boothId
// POST /api/booths/:boothId/summary (personalized)
```

### Chat
```typescript
// POST /api/chat/sessions
// POST /api/chat/sessions/:sessionId/messages
// GET /api/chat/sessions/:sessionId
// POST /api/chat/generate-response
```

### Analytics
```typescript
// POST /api/analytics/booth-visit
// GET /api/analytics/recommendations/:userId
// GET /api/analytics/user-stats/:userId
```

## Environment Variables

Required environment variables (see `.env.example`):

```
VITE_CLERK_PUBLISHABLE_KEY      # Clerk authentication key
VITE_CONVEX_URL                 # Convex backend URL
VITE_AMPLITUDE_API_KEY          # Amplitude analytics
VITE_OPENAI_API_KEY             # For AI conversations
VITE_SPEECH_TO_TEXT_SERVICE     # Service provider and key
VITE_TEXT_TO_SPEECH_SERVICE     # Service provider and key
```

## Development Workflow

### Setting Up New Features

1. **Add Types** → `/src/types/index.ts`
2. **Add API Functions** → `/src/services/api.ts`
3. **Update Store** → `/src/store/useAppStore.ts` (if needed)
4. **Create/Update Component** → `/src/pages/` or `/src/components/`
5. **Add Styling** → Component CSS file
6. **Test Integration** → Manual testing in dev server

### Example: Adding a New Feature

Let's say you want to add "Company Profiles" page:

1. **Add types in `/src/types/index.ts`:**
```typescript
export interface CompanyProfile {
  id: string
  name: string
  logo: string
  description: string
  careers_url: string
  booths: Booth[]
  // ... more fields
}
```

2. **Add API in `/src/services/api.ts`:**
```typescript
export const getCompanyProfile = async (companyId: string): Promise<CompanyProfile> => {
  // TODO: Fetch from Convex
}
```

3. **Create component `/src/pages/CompanyProfile.tsx`:**
```typescript
export default function CompanyProfile() {
  const { id } = useParams()
  const [company, setCompany] = useState<CompanyProfile | null>(null)
  
  useEffect(() => {
    getCompanyProfile(id!).then(setCompany)
  }, [id])
  
  return (/* JSX */)
}
```

4. **Add route in `/src/App.tsx`:**
```typescript
<Route path="/company/:id" element={<CompanyProfile />} />
```

5. **Update Navigation** if needed

## Common Tasks

### Styling a Component
- Use CSS variables from `:root` for colors
- Follow mobile-first responsive design
- Use flexbox/grid for layouts
- Maintain consistent spacing (use 0.25rem, 0.5rem, 1rem, 1.5rem, 2rem)

### Adding Form Validation
- Use React Hook Form + Zod (already installed)
- Define schema in component
- Handle validation errors gracefully

### Error Handling
- Use Zustand `setError()` for UI errors
- Show error toast or modal
- Log to console for debugging
- Log to error tracking service (Sentry, etc.)

### Performance Optimization
- Use `React.memo()` for expensive components
- Implement pagination for long lists
- Lazy load images
- Code split by route (automatic with React Router)

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (recommended for Vite + React)
```bash
vercel deploy
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Set Production Environment Variables
- Set on hosting platform dashboard
- Ensure VITE_ prefix for client-side vars
- Keep secrets secure

## Troubleshooting

### "Cannot find module" errors
- Check file exists and has default export
- Clear `.next` or `dist` folders
- Restart dev server

### CSS not loading
- Verify CSS import in component
- Check class names match CSS file
- Use browser dev tools to inspect styles

### API calls failing
- Check environment variables
- Verify backend endpoints exist
- Check CORS configuration
- Check authentication token

### Geolocation not working
- Requires HTTPS (except localhost)
- Browser may prompt for permission
- User can deny permission
- Test on physical device for GPS

## Resources

- **React**: https://react.dev
- **Vite**: https://vitejs.dev
- **Zustand**: https://github.com/pmndrs/zustand
- **Convex**: https://docs.convex.dev
- **Clerk**: https://clerk.com/docs
- **Amplitude**: https://amplitude.com/docs

## Support & Next Steps

1. Review all TODO comments in codebase
2. Prioritize backend implementation
3. Set up Convex and Clerk
4. Implement resume parsing
5. Add AI chat responses
6. Integrate analytics
7. Test thoroughly
8. Deploy!

Good luck with Badge! 🚀
