# Production Deployment Guide

## 1. Backend Deployment (Convex)

1. **Deploy to Convex Production**:
   Open your terminal in the project directory and run:
   ```bash
   npx convex deploy
   ```
   This command will push your schema and functions to your production Convex deployment. It will also give you the **Production URL**, which looks like `https://funny-giraffe-123.convex.cloud`. Copy this 
   URL.

   https://merry-armadillo-379.convex.cloud - prod url

2. **Environment Variables**:
   If you have any backend environment variables (like API keys for Gemini, ElevenLabs, etc.) set in your Convex dashboard, make sure to add them to the **Production** environment in the Convex Dashboard settings as well.
   - Go to [dashboard.convex.dev](https://dashboard.convex.dev)
   - Select your project
   - Go to Settings > Environment Variables
   - Ensure variables are set for "Production"

## 2. Authentication Setup (Clerk)

1. **Get Production Keys**:
   - In your Clerk Dashboard, switch to **Production**.
   - Copy your **Publishable Key** (starts with `pk_live_...`).
   - Copy your **Secret Key** (starts with `sk_live_...`).

2. **Configure Convex with Clerk**:
   In your **Convex Dashboard** > **Settings** > **Environment Variables** (Production Environment):
   - Add a new variable named `CLERK_ISSUER_URL`.
   - Set the value to your custom domain URL: `https://clerk.badgeapp.com`
   *(This allows Convex to verify the identity of your users using your custom domain).*

## 3. Frontend Deployment (Vercel)

We recommend using **Vercel** for hosting React/Vite apps.

1. **Push to GitHub**: Ensure your latest code is pushed to your GitHub repository.
2. **Import Project**:
   - Go to [Vercel](https://vercel.com) and click "Add New..." > "Project".
   - Import your `Badge` repository.
3. **Configure Settings**:
   - **Framework Preset**: Vite (should be auto-detected).
   - **Root Directory**: `badge-app` (Since your package.json is inside this subfolder).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   Add the following variables in the Vercel deployment settings:
   - `VITE_CONVEX_URL`: `https://merry-armadillo-379.convex.cloud`
   - `VITE_CLERK_PUBLISHABLE_KEY`: Paste your `pk_live_...` key here.
5. **Deploy**: Click "Deploy".

## 4. Domain Configuration

1. **Vercel Domains**:
   - Once deployed, go to the project **Settings** > **Domains**.
   - Enter your custom domain (e.g., `yourdomain.com`).
   - Vercel will provide DNS records (A record or CNAME) to add to your domain registrar (GoDaddy, Namecheap, etc.).
   - It usually takes a few minutes for SSL to generate.

## 5. Final Checks

- Visit your live URL.
- specific check: **Auth**: Try creating an account/logging in.
- specific check: **Convex**: Ensure data is loading (your BrainVisual and Profile data).
- specific check: **APIs**: Test the "Live Conversation" to ensure the backend keys (Gemini/ElevenLabs) are working in production.
