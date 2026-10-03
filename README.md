# LeadScore AI 🎯

> AI-powered lead quality scorer for freelancers, agencies, and sales teams.

![LeadScore AI Dashboard](./public/dashboard-preview.png)

## Features

- 🌐 **URL Scraping** — Paste a website URL and AI extracts all lead intelligence automatically
- 🧠 **Gemini AI Scoring** — Scores leads 0–100 across 5 dimensions
- 📊 **Score Breakdown** — Business Quality, Buying Intent, Website Quality, Contact Info, Conversion Potential
- 💡 **AI Suggestions** — Specific, actionable improvement recommendations
- 📧 **Outreach Templates** — AI-generated personalized email templates
- ⚠️ **Risk Flags** — Automatic red flag detection
- 📜 **Lead History** — All scored leads saved to Supabase

## Score Dimensions

| Dimension | Description |
|-----------|-------------|
| Business Quality | Company legitimacy, reviews, team, funding |
| Buying Intent | Growth signals, job postings, tech stack |
| Website Quality | Design, trust signals, content quality |
| Contact Info | Email, phone, LinkedIn, decision maker |
| Conversion Potential | Budget, timing, company size fit |

## Tech Stack

- **Frontend**: Next.js 15 + Tailwind CSS
- **Backend**: Next.js API Routes
- **AI**: Google Gemini 1.5 Flash
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## Quick Start

### 1. Clone and install
\`\`\`bash
git clone <repo>
cd lead-qualifier
npm install
\`\`\`

### 2. Environment variables
\`\`\`bash
cp .env.example .env.local
\`\`\`

Fill in your `.env.local`:
\`\`\`env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
\`\`\`

### 3. Set up Supabase
Run the SQL in `supabase/schema.sql` in your Supabase SQL editor.

### 4. Get a Gemini API key
Get your free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 5. Run locally
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

## Usage

1. Enter a **company name** and **website URL** (or paste manual lead info)
2. Optionally add industry and contact info
3. Click **Score This Lead**
4. Review the 0–100 score, breakdown, suggestions, and outreach template
5. Use the **History** panel to view and revisit past leads

## Scoring Guide

| Score | Status | Meaning |
|-------|--------|---------|
| 80–100 | 🟢 Excellent | High priority — reach out immediately |
| 60–79 | 🔵 Good | Strong lead — worth pursuing |
| 40–59 | 🟡 Fair | Moderate lead — needs more research |
| 0–39 | 🔴 Poor | Low priority — consider skipping |
