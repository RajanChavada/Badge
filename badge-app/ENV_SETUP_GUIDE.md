# Environment Setup Guide

## Overview

The Badge app requires several API keys and environment variables to function properly. This guide walks you through setting them up.

## Files

- **`.env.local`** - Your actual configuration file with API keys (gitignored, never committed)
- **`.env.example`** - Template file showing what keys are needed (safe to commit)

## Step-by-Step Setup

### 1. Clerk Authentication Setup

**Purpose**: User authentication and account management

**Steps**:
1. Go to https://clerk.com/
2. Sign in or create an account
3. Create a new project or select existing one
4. Go to **API Keys** from the left sidebar
5. Copy the **Publishable Key** (starts with `pk_`)
6. Paste into `.env.local`:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

**Verification**: You should see an authentication modal when running the app

---

### 2. Amplitude Analytics Setup

**Purpose**: Event tracking and real-time analytics for geolocation and booth visits

**Steps**:
1. Go to https://amplitude.com/
2. Sign in or create account
3. Go to your project dashboard
4. Navigate to **Settings** → **Project Settings** → **API Keys**
5. Copy the **API Key**
6. Paste into `.env.local`:
   ```
   VITE_AMPLITUDE_API_KEY=your_amplitude_api_key_here
   ```

**Verification**: Check Amplitude dashboard for incoming events when you open the map

---

### 3. Convex Backend Setup

**Purpose**: Serverless backend for storing location data and booth visits

**Steps**:
1. Go to https://convex.dev/
2. Sign in or create account
3. Create a new project or select existing one
4. Go to **Deployment** from left sidebar
5. Copy the **Deployment URL** (looks like: `https://your_project.convex.cloud`)
6. Paste into `.env.local`:
   ```
   VITE_CONVEX_URL=https://your_project.convex.cloud
   ```

**Important**: Also set up the Convex backend in `/my-app` folder:
```bash
cd ../my-app
npx convex deploy
```

**Verification**: Check Convex dashboard for database tables with location and booth visit data

---

### 4. Google Maps API Setup (Optional)

**Purpose**: For future map features and location visualization

**Steps**:
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable **Maps JavaScript API**
4. Go to **Credentials**
5. Create new **API Key**
6. Copy the key
7. Paste into `.env.local`:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

**Note**: Not required for current functionality, but useful for future features

---

## Environment Variables Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ Yes | User authentication | `pk_test_...` |
| `VITE_AMPLITUDE_API_KEY` | ✅ Yes | Analytics tracking | `abc123def456` |
| `VITE_CONVEX_URL` | ✅ Yes | Backend database | `https://proj.convex.cloud` |
| `VITE_GOOGLE_MAPS_API_KEY` | ❌ No | Map features | `AIzaSyD...` |
| `VITE_PDFJS_WORKER_URL` | ❌ No | PDF handling | `/pdf.worker.min.js` |
| `VITE_FLOOR_IDENTIFIER` | ❌ No | Geolocation floor | `MyHall Floor 3` |
| `VITE_APP_ENV` | ❌ No | Environment type | `development` |
| `VITE_API_BASE_URL` | ❌ No | Backend API URL | `http://localhost:3000` |

---

## Common Issues & Troubleshooting

### "Clerk is not available"
- **Issue**: Missing or invalid `VITE_CLERK_PUBLISHABLE_KEY`
- **Fix**: Get key from Clerk dashboard, verify it starts with `pk_`

### "Amplitude events not showing"
- **Issue**: Missing or invalid `VITE_AMPLITUDE_API_KEY`
- **Fix**: Get fresh key from Amplitude Settings, redeploy app

### "Geolocation data not saving"
- **Issue**: Missing or incorrect `VITE_CONVEX_URL`
- **Fix**: Copy URL from Convex Deployment settings exactly

### "White screen after loading"
- **Issue**: One or more required keys missing
- **Fix**: Check browser console for specific error messages

### ".env.local accidentally committed"
- **Issue**: API keys exposed in git history
- **Fix**: Regenerate all API keys immediately, rotate credentials

---

## Using Environment Variables in Code

### In React Components:
```javascript
// Access with import.meta.env prefix
const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY
const convexUrl = import.meta.env.VITE_CONVEX_URL

// Variables are available during build time
console.log(import.meta.env.VITE_APP_ENV) // 'development'
```

### Amplitude Initialization:
```javascript
import * as amplitude from '@amplitude/analytics-browser'

amplitude.init(import.meta.env.VITE_AMPLITUDE_API_KEY, {
  userId: userProfile?.id,
})
```

### Convex Setup:
```javascript
import { ConvexProvider, ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)
```

---

## Security Best Practices

✅ **DO:**
- Store `.env.local` locally only
- Use different keys for development and production
- Rotate keys regularly
- Keep `.gitignore` with `*.local` entries
- Use `.env.example` as template for documentation

❌ **DON'T:**
- Commit `.env.local` to git
- Share API keys in messages or docs
- Use production keys in development
- Hardcode keys in source files
- Store keys in version control

---

## Development vs Production

### Development Setup:
```bash
# .env.local (local file, not committed)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_dev_key
VITE_AMPLITUDE_API_KEY=dev_api_key
VITE_CONVEX_URL=https://dev-project.convex.cloud
```

### Production Setup:
Use your hosting platform's secrets management:
- **Vercel**: Environment Variables in project settings
- **Netlify**: Build & Deploy → Environment
- **Docker**: Pass as build arguments
- **CI/CD**: GitHub Secrets, GitLab CI/CD Variables, etc.

---

## Quick Start Checklist

- [ ] Copy `.env.example` to `.env.local` (or create from template)
- [ ] Get Clerk Publishable Key from clerk.com
- [ ] Get Amplitude API Key from amplitude.com
- [ ] Get Convex URL from convex.dev
- [ ] Fill in `.env.local` with actual keys
- [ ] Run `npm run dev` to start development server
- [ ] Test app loads without errors
- [ ] Check browser console for any warnings
- [ ] Verify geolocation tracking works
- [ ] Check Amplitude dashboard for events
- [ ] Verify Convex database receives data

---

## Verification Commands

### Test Clerk:
```javascript
// Open browser console and run:
console.log(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
```

### Test Amplitude:
```javascript
// Check if Amplitude is initialized
console.log(window.amplitude)
```

### Test Convex:
```javascript
// Should show connection details
console.log(import.meta.env.VITE_CONVEX_URL)
```

---

## Need Help?

### Clerk Issues:
- Docs: https://clerk.com/docs
- Support: support@clerk.com

### Amplitude Issues:
- Docs: https://developers.amplitude.com/
- Support: support@amplitude.com

### Convex Issues:
- Docs: https://docs.convex.dev/
- Discord: https://discord.gg/convex

---

## Next Steps

After setting up environment:
1. Run `npm run dev` to start dev server
2. Open app in browser
3. Allow geolocation permission
4. Click around and interact with map
5. Check Amplitude dashboard for events
6. Verify Convex database has data
7. Deploy when ready!

---

**Last Updated**: January 17, 2026
**Status**: ✅ Ready to configure

