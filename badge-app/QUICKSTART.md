# Badge - Quick Start Guide

## 🚀 Get Started in 2 Minutes

### Prerequisites
- Node.js 18+ installed
- npm installed

### Step 1: Install Dependencies
```bash
cd toy-app
npm install --legacy-peer-deps
```

### Step 2: Start Development Server
```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Step 3: Navigate the App

Since authentication is required, you'll need to:
1. Set `VITE_CLERK_PUBLISHABLE_KEY` in `.env.local`
2. Or temporarily disable auth for testing

**To disable auth for testing**, edit `/src/App.tsx`:
```typescript
// Temporarily comment out auth check
// <SignedOut>
//   <RedirectToSignIn />
// </SignedOut>
<SignedIn>
  {/* app content */}
</SignedIn>
// Can also just render content without auth guards
```

## 📋 Pages to Explore

### 1. Dashboard (`/dashboard`)
- Overview of networking stats
- Quick action buttons
- Recommendations section

### 2. Profile (`/profile`)
- Upload resume (simulate upload)
- Fill in personal details
- Select interests, sectors, target roles
- Edit profile information

### 3. Map (`/map`)
- Interactive booth map
- Search and filter booths
- Click booths to see details
- View recruiter information

### 4. Chat (`/chat`)
- Create practice sessions
- Chat with simulated AI
- Microphone button (UI only, needs implementation)
- Text-to-speech button (UI only)

## 🎯 Feature Checklist

Frontend is **100% complete** with:
- ✅ All pages implemented
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Interactive components
- ✅ Form handling
- ✅ State management
- ✅ Navigation
- ✅ Styling

Backend needs:
- ⏳ Convex database setup
- ⏳ Resume parsing service
- ⏳ AI chat responses
- ⏳ Voice features
- ⏳ Analytics tracking

## 🔧 Build for Production

```bash
npm run build
```

Output goes to `/dist` folder, ready to deploy.

## 📖 Full Documentation

- **README.md** - Features & setup
- **IMPLEMENTATION.md** - Backend integration checklist
- **PROJECT_SUMMARY.md** - Complete overview

## 💡 Key Files to Edit

- **Pages**: `/src/pages/*.tsx`
- **Components**: `/src/components/*.tsx`
- **Types**: `/src/types/index.ts`
- **API**: `/src/services/api.ts`
- **Store**: `/src/store/useAppStore.ts`
- **Styling**: Component `.css` files

## 🚨 Troubleshooting

**Port 5173 already in use?**
```bash
npm run dev -- --port 3000
```

**Module not found error?**
```bash
rm -rf node_modules dist
npm install --legacy-peer-deps
npm run dev
```

**Build errors?**
```bash
npm run build
```

Check error output and look for TypeScript errors.

## 🔐 Environment Variables

Create `.env.local` with:
```
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_CONVEX_URL=your_convex_url
VITE_AMPLITUDE_API_KEY=your_amplitude_key
```

## 📱 Testing on Mobile

```bash
npm run dev -- --host
```

Then access from mobile at the Network URL shown.

## 🎓 Learning Path

1. Explore the pages
2. Check component structure
3. Review type definitions
4. Look at state management (Zustand)
5. Check styling approach (CSS modules per component)
6. Read TODO comments in api.ts for backend integration points

## 📞 Common Questions

**Q: Can I edit profile data?**
A: Yes! The Profile page has full CRUD functionality with local storage in Zustand.

**Q: Does chat actually AI work?**
A: Not yet - it's a UI placeholder. Backend integration needed via OpenAI/Claude.

**Q: Can I upload a real resume?**
A: The UI is ready but parsing needs backend. File upload UI works locally.

**Q: How do I modify booth data?**
A: Currently mocked in `/src/pages/Map.tsx`. Will come from Convex backend.

**Q: Is the map real?**
A: It's an interactive SVG visualization with mock booth data. Can be upgraded to Leaflet.

## ✨ Next Steps

1. Fork/clone the project
2. Set up Convex backend
3. Implement API functions in `/src/services/api.ts`
4. Add real data sources
5. Deploy! 🎉

---

**Happy Networking! 🤝**

For questions or issues, check the TODO comments throughout the code.
