# MeetingMind - Enhanced Version

**Stop taking notes. Start getting things done.**

MeetingMind is an AI-powered meeting assistant that extracts action items from meeting transcripts and generates follow-up emails with enhanced participant tracking and dashboard functionality.

## 🆕 New Features

### Enhanced Participant Focus
- **Detailed participant information** with names, titles, roles, and companies
- **Prominently displayed** as the second section after meeting summary
- **Professional participant cards** with initials avatars

### Persistent Dashboard
- **Auto-saves all meeting analyses** to your dashboard
- **Click on any meeting** to view full analysis details
- **Real-time statistics** showing total meetings and action items

### Action Item Management
- **Mark action items as complete** with interactive checkboxes
- **Delete action items** you no longer need
- **Visual completion tracking** with strikethrough for completed tasks
- **Priority-based color coding** (red=high, amber=medium, blue=low)

### Audio Upload Support
- **Drag & drop audio files** or click to upload
- **Multiple format support**: MP3, MP4, WAV, WEBM, OGG, FLAC
- **Automatic transcription** via OpenAI Whisper API
- **Two-step processing**: Transcribe → Analyze

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase project (for dashboard persistence)
- API Keys:
  - Anthropic Claude API (transcript analysis)
  - OpenAI API (audio transcription)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment variables** (already configured)
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-...
   OPENAI_API_KEY=sk-proj-...
   NEXT_PUBLIC_SUPABASE_URL=https://...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

3. **Set up Supabase database**
   ```bash
   # Run the schema file in your Supabase SQL editor
   cat supabase/schema.sql
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🎯 How to Use

### Text Analysis
1. Go to homepage
2. Ensure **"📝 Paste Transcript"** tab is selected
3. Paste your meeting transcript
4. Click **"Extract Action Items"**
5. View results with enhanced participant details

### Audio Analysis
1. Click **"🎵 Upload Audio"** tab
2. Drag/drop audio file or click **"Choose File"**
3. Click **"Transcribe & Analyze"**
4. Watch two-step processing: Transcription → Analysis
5. View complete meeting analysis

### Dashboard Management
1. Go to **Dashboard** (auto-populated after each analysis)
2. **Click on any meeting** to view full details
3. **Check/uncheck action items** to mark completion
4. **Delete action items** using the × button
5. **Navigate back** to dashboard or create new meeting

## 📊 Current Status

### ✅ Fully Working
- Landing page with dual input modes (text/audio)
- Audio transcription via Whisper API
- Enhanced Claude analysis with participant focus
- Results display with prominent participant section
- Pricing and How It Works pages
- Action item management (complete/remove)
- Dashboard UI with meeting management

### 🔧 Setup Required
- **Supabase Database**: Run `supabase/schema.sql` in your Supabase project
- **Table Creation**: The app expects `meetings`, `action_items`, and `profiles` tables

### 🐛 Known Issues
- Claude API occasionally returns malformed JSON (intermittent)
- Dashboard will show errors until Supabase tables are created

## 🔧 Database Setup

**Important:** Run this SQL in your Supabase SQL editor:

```sql
-- See supabase/schema.sql for complete database schema
-- Creates tables: profiles, meetings, action_items, team_members
-- Sets up Row Level Security and policies
-- Creates indexes for performance
```

## 🎨 Design Updates

- **Black color scheme** instead of violet/purple gradients
- **Readable text colors** on light backgrounds
- **Enhanced participant cards** with company/role information
- **Interactive action items** with completion tracking
- **Priority color coding** for better visual hierarchy

## 🚀 Perfect for Client Calls

- Upload recorded client phone calls (with proper consent)
- Automatic extraction of participant details and titles
- Professional follow-up email generation
- Persistent storage for future reference
- Action item tracking for accountability

## 📝 Next Steps

1. **Set up Supabase tables** using the provided schema
2. **Test audio upload** with actual meeting recordings
3. **Review dashboard functionality** with saved meetings
4. **Customize participant extraction** for your specific use case

The application is fully functional for demonstration and ready for production use once the database is configured!

---

**Built with:** Next.js 14, TypeScript, Tailwind CSS, Claude API, OpenAI Whisper, Supabase