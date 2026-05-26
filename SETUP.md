# AS — Setup Guide

> A private digital world made only for two people 💕

## Quick Start (5 minutes)

### 1. Create a Supabase Account (Free)

1. Go to [supabase.com](https://supabase.com) and sign up (free, no credit card)
2. Click **"New Project"**
3. Set your project details:
   - **Name**: `as-couple-app`
   - **Database Password**: Pick a strong one (save it!)
   - **Region**: Choose closest to you
4. Wait ~2 minutes for the project to be created

### 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public** key (under Project API keys)

### 3. Configure the App

Open `.env.local` in the project root and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Set Up the Database

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Click **"Run"** — this creates all tables, security policies, and realtime subscriptions

### 5. Create Storage Bucket + Policies

1. In Supabase dashboard, go to **Storage**
2. Click **"New bucket"**
3. Name it `couple-media`
4. Set it to **Private** (not public)
5. Click **"Create bucket"**
6. In **SQL Editor**, run the full contents of `supabase/storage_policies.sql`

> **Important:** Without storage RLS policies, uploads/downloads fail with `StorageApiError: Object not found`.

### 6. Create Your Two Accounts

1. In Supabase dashboard, go to **Authentication → Users**
2. Click **"Add user"** → **"Create new user"**
3. Create two accounts:
   - **User 1**: Your email + password
   - **User 2**: Partner's email + password
4. Note: You can also use made-up emails since we don't verify them

### 7. Link Your Accounts as a Couple

Run this in the **SQL Editor** (replace the emails with your actual ones):

```sql
-- Step 1: Create a couple
INSERT INTO couples (name, start_date)
VALUES ('Aryan & Shraddha', '2024-01-01')
RETURNING id;

-- Step 2: Link both users to the couple (use the ID from Step 1)
UPDATE profiles SET couple_id = 'YOUR_COUPLE_ID_FROM_STEP_1'
WHERE username IN ('user1_email_prefix', 'user2_email_prefix');
```

Or more precisely:
```sql
-- Do it all in one go:
DO $$
DECLARE
  couple_uuid UUID;
BEGIN
  -- Create the couple
  INSERT INTO couples (name, start_date)
  VALUES ('Aryan & Shraddha', '2024-01-01'::timestamptz)
  RETURNING id INTO couple_uuid;
  
  -- Link all profiles to this couple (since there are only 2 users)
  UPDATE profiles SET couple_id = couple_uuid;
END $$;
```

### 8. Run the App

```bash
cd couple-app
npm run dev
```

Open **http://localhost:3000** in your browser. Sign in with one of the accounts you created!

---

## Testing Locally

To test real-time features:
1. Open **http://localhost:3000** in one browser window
2. Open **http://localhost:3000** in a different browser or incognito window
3. Log in as different users in each window
4. Send messages — they should appear instantly in both windows!

---

## Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in with GitHub
3. Click **"Add New Project"** → Import your repo
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **"Deploy"**
6. Your app will be live at `your-project.vercel.app`

> **Tip**: Set a custom domain in Vercel settings for a more personal URL!

---

## Project Structure

```
couple-app/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Splash screen
│   │   ├── layout.tsx            # Root layout (font, meta)
│   │   ├── globals.css           # Design system
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── (app)/
│   │       ├── layout.tsx        # App shell + bottom nav
│   │       ├── home/page.tsx     # Dashboard
│   │       ├── chat/page.tsx     # Real-time chat
│   │       ├── memories/page.tsx # Photo gallery
│   │       └── settings/page.tsx # Settings
│   ├── components/
│   │   └── ui/                   # Reusable UI components
│   ├── hooks/
│   │   └── useSupabase.ts        # All Supabase data hooks
│   ├── lib/
│   │   ├── animations.ts         # Framer Motion presets
│   │   └── supabase/             # Supabase client configs
│   ├── store/
│   │   └── index.ts              # Zustand state stores
│   └── types/
│       └── index.ts              # TypeScript types
├── supabase/
│   └── schema.sql                # Database schema
├── .env.local                    # Your Supabase keys
└── package.json
```

---

## Customization

### Change App Name
- Update `src/app/layout.tsx` → `metadata.title`
- Update `src/app/page.tsx` → splash screen text

### Change Colors
- Edit `src/app/globals.css` → `@theme inline` section
- All colors use HSL for easy tweaking

### Change Couple Names
- Update `src/app/(app)/home/page.tsx` → Avatar `alt` props and labels

### Change Start Date
- Update `src/app/(app)/home/page.tsx` → `useDaysCounter("2024-01-01")`
- Replace with your actual relationship start date

---

## What's Next (Phase 2)

Once you're comfortable with Phase 1, here's what comes next:
- 📸 Image upload in chat (Supabase Storage integration)
- 🎤 Voice notes
- 🎨 Theme switching (all 5 themes)
- 🔔 Push notifications
- 📱 PWA for home screen install
