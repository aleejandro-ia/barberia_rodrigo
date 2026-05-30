# Barbería Rodrigo

Premium barbershop booking web app. Clients book appointments online via phone OTP or Google auth. Admin panel for the barber to manage gallery, schedule, and appointments.

## Stack
- Next.js 16 + TypeScript
- Supabase (PostgreSQL + Auth + Storage)
- Tailwind v4 + shadcn/ui
- Motion (animations)
- Vercel (deploy)

## Setup

### 1. Supabase Project
1. Create a new project at supabase.com
2. Go to SQL Editor, paste and run `supabase/migrations/001_initial_schema.sql`
3. Go to Storage, create bucket named `gallery` (Public: ON)
4. Go to Authentication > Providers:
   - Enable Phone (connect Twilio: account SID, auth token, message service SID)
   - Enable Google (add Client ID + Secret from Google Cloud Console)
5. Go to Database > Configuration, run:
   `ALTER DATABASE postgres SET app.settings.admin_email = 'your-email@gmail.com';`
   (replace with Rodrigo's admin email)

### 2. Google OAuth
1. Go to console.cloud.google.com
2. Create OAuth 2.0 credentials (Web application)
3. Add authorized redirect URI: `https://[your-supabase-project].supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase Auth > Google provider

### 3. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from Supabase Settings > API]
SUPABASE_SERVICE_ROLE_KEY=[service role key - keep secret!]
ADMIN_EMAIL=[Rodrigo's email for admin access]
NEXT_PUBLIC_WHATSAPP_NUMBER=[phone number without + e.g. 34612345678]
```

### 4. Local Development
```bash
npm install
npm run dev
```
Open http://localhost:3000

### 5. Deploy to Vercel
1. Push to GitHub
2. Import project in vercel.com
3. Add all env vars from .env.local to Vercel project settings
4. Deploy

## Admin Panel
Access at `/admin` — only Rodrigo's email (ADMIN_EMAIL) can log in.

Features:
- **Citas**: View and cancel appointments
- **Galería**: Upload/delete haircut photos
- **Horarios**: Set available days and time slots

## Notes
- Phone OTP: Supabase free tier allows ~50 SMS/month (sufficient for a local barbershop)
- Gallery images are stored in Supabase Storage (public bucket)
- Each client can only have 1 active future appointment at a time (anti-spam)
