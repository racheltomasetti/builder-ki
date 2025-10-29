📋 UPDATED BUILD PLAN: MVP for Story Video

What Changed:

- ❌ Removed: Web backfill UI (you'll use SQL directly)
- ✅ Added: Mobile daily log interface (intention/reflection)
- ✅ Added: Mobile media upload (camera + roll)
- ✅ Kept: Web media library VIEW + calendar integration

---

🎯 PHASE-BY-PHASE BUILD PLAN (UPDATED)

PHASE 1: Database Foundation (30-45 min)

Goal: Add tables for daily logs and media

Tasks:

1. Create migration: supabase/daily-logs-media.sql
2. Run on Supabase

Schema:
-- Add to captures table
ALTER TABLE captures
ADD COLUMN note_type TEXT DEFAULT 'general'
CHECK (note_type IN ('intention', 'daily', 'reflection', 'general')),
ADD COLUMN log_date DATE;

-- Daily logs table
CREATE TABLE daily_logs (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
date DATE NOT NULL,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
UNIQUE(user_id, date)
);

-- Media items table
CREATE TABLE media_items (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
file_url TEXT NOT NULL,
file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
original_date DATE,
log_date DATE,
caption TEXT,
tags TEXT[],
metadata JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video stories table (for generated scripts)
CREATE TABLE video_stories (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
title TEXT NOT NULL,
date_range_start DATE,
date_range_end DATE,
script_text TEXT NOT NULL,
script_metadata JSONB,
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes and RLS policies...

YOU DO AFTER THIS PHASE: Backfill daily logs via SQL INSERT statements in Supabase SQL editor

---

PHASE 2: Mobile Daily Log Interface (UPDATED - 1.5 hours)

Goal: Dedicated daily log screen for intention/reflection rituals; capture screen stays untouched

Tasks:

2A: Create Daily Log Screen (1 hour)

Create new screen: mobile/screens/DailyLogScreen.tsx

- Show today's date
- "Set Intention" button → records voice note with note_type='intention', log_date=today
- Display today's status:
  - ✓ Intention set (show time)
  - Count of daily captures
  - ? Reflection pending (or ✓ if done)
- "Add Reflection" button → records voice note with note_type='reflection', log_date=today
- Reuse existing voice recording component from CaptureScreen
- Create daily_logs record for today when first action happens

2B: Update Capture Screen Logic (15 min)

Modify mobile/screens/CaptureScreen.tsx (minimal changes):

- When saving voice note, set log_date=today
- Create daily_logs record for today if doesn't exist
- That's it - UI stays exactly the same

2C: Add Navigation (15 min)

- Add "Daily Log" tab/button to navigation
- Or add as a screen accessible from main navigation

Daily Log Screen UI:
┌─────────────────────────────────┐
│ Daily Log │
│ October 28, 2024 │
├─────────────────────────────────┤
│ │
│ Morning Intention │
│ [Set Today's Intention] │
│ (or if set:) │
│ ✓ Set at 7:23am │
│ [🎤 Listen] │
│ │
├─────────────────────────────────┤
│ Daily Captures │
│ ••• 3 thoughts captured │
│ │
├─────────────────────────────────┤
│ Evening Reflection │
│ [Add Reflection] │
│ (or if done:) │
│ ✓ Reflected at 9:47pm │
│ [🎤 Listen] │
│ │
└─────────────────────────────────┘

Capture Screen:
┌─────────────────────────────────┐
│ Capture │
├─────────────────────────────────┤
│ │
│ │
│ [ ⚫ ] │
│ Tap to Record │
│ │
│ (stays exactly as it is now) │
│ │
└─────────────────────────────────┘

Navigation:
┌─────────────────────────────────┐
│ [Daily Log] [Capture] [Upload] │ ← Bottom tabs
└─────────────────────────────────┘

---

PHASE 3: Mobile Media Upload (2-2.5 hours)

Goal: Upload photos from camera/roll with EXIF date extraction

Tasks:

1. Install libraries:

   - expo-image-picker (already have?)
   - expo-media-library for camera roll
   - expo-file-system for file handling
   - react-native-exif or similar for EXIF extraction

2. Create media upload screen (mobile/screens/MediaUploadScreen.tsx):

   - "Take Photo" button → opens camera
   - "Choose from Library" button → opens camera roll
   - Multi-select for bulk upload

3. Upload flow:

   - Select photo(s)
   - Extract EXIF DateTimeOriginal
   - Upload to Supabase Storage (media-items bucket)
   - Create media_items record with original_date
   - Auto-set log_date if daily_log exists for that date

4. Add to navigation/tabs

Mobile UI:
┌─────────────────────────────────┐
│ Upload Media │
├─────────────────────────────────┤
│ │
│ [📷 Take Photo] │
│ │
│ [🖼️ Choose from Library] │
│ │
├─────────────────────────────────┤
│ Recently Uploaded: │
│ [img] Oct 28 [img] Oct 27 │
└─────────────────────────────────┘

YOU DO AFTER THIS PHASE: Upload all your journey photos from phone

---

PHASE 4: Web Calendar View (1 hour)

Goal: Visual calendar showing days with logs/media

Tasks:

1. Install: npm install react-calendar (or build custom)
2. Create page: web/app/dashboard/calendar/page.tsx

   - Month view calendar
   - Fetch daily log counts + media counts per day
   - Highlight days: blue dot (has log), green dot (has media)
   - Click day → navigate to /dashboard/calendar/[date]

3. API route: web/app/api/calendar/summary/route.ts

   - Return: { date: '2024-10-28', hasLog: true, mediaCount: 3 }

Calendar UI:
┌──────────────────────────────────┐
│ October 2024 < > │
├──────────────────────────────────┤
│ S M T W T F S │
│ 1● 2 3 4 │
│ 5 6●● 7 8● 9 10 11 │
│12 13● 14 15●● 16 17 18 │
│19 20● 21 22●● 23● 24 25 │
│26 27● 28●● 29 30 31 │
└──────────────────────────────────┘
● = has daily log ●● = has log + media

---

PHASE 5: Web Daily Log Detail View (1 hour)

Goal: Show everything for a specific day

Tasks:

1. Create page: web/app/dashboard/calendar/[date]/page.tsx

   - Query captures where log_date = date (intention, daily, reflection)
   - Query media_items where log_date = date or original_date = date
   - Display in sections:
     - Intention (if exists)
     - Daily captures (transcriptions + insights)
     - Media grid
     - Reflection (if exists)

Detail View:
┌─────────────────────────────────┐
│ ← October 28, 2024 │
├─────────────────────────────────┤
│ Intention: │
│ 🎤 [audio] "To finish the MVP" │
│ Transcription: "Today I will..." │
│ │
│ Daily Captures (3): │
│ 🎤 10:23am - "Just realized..." │
│ 🎤 2:45pm - "Making progress..."│
│ 🎤 6:10pm - "Almost there..." │
│ │
│ Media (5 photos): │
│ [img] [img] [img] [img] [img] │
│ │
│ Reflection: │
│ 🎤 [audio] "Today was good..." │
└─────────────────────────────────┘

---

PHASE 6: Web Media Library (45 min)

Goal: Browse all uploaded media

Tasks:

1. Create page: web/app/dashboard/media/page.tsx

   - Grid view of all media_items
   - Sort by original_date DESC
   - Click to view full size
   - Show date + caption if exists

Media Library:
┌─────────────────────────────────┐
│ Media Library (127 photos) │
├─────────────────────────────────┤
│ [img] [img] [img] [img] [img] │
│ 10/28 10/27 10/27 10/25 10/24 │
│ │
│ [img] [img] [img] [img] [img] │
│ 10/23 10/20 10/18 10/15 10/12 │
│ │
│ ... │
└─────────────────────────────────┘

---

PHASE 7: AI Story Generator (2-3 hours)

Goal: Synthesize logs + media into narrative script

Tasks:

1. Create page: web/app/dashboard/stories/create/page.tsx

   - Form: title, date range, target length
   - "Generate Story" button
   - Loading state (30-60 sec)

2. Create API: web/app/api/stories/generate/route.ts

   - Query all captures in date range with transcriptions
   - Query all media_items in date range with dates
   - Format for Claude
   - Send with story generation prompt
   - Save to video_stories table
   - Return generated script

3. Create prompt: lib/prompts/story-generator.ts

Prompt Template:
export const storyGeneratorPrompt = (data: {
captures: Capture[];
media: MediaItem[];
dateRange: { start: string; end: string };
targetLength: number;
}) => `
You are helping Rachel tell the story of her journey building KI,
an AI-powered personal growth platform.

CONTEXT:

- Journey span: ${data.dateRange.start} to ${data.dateRange.end}
- Goal: ${targetLength}-minute video script for LinkedIn/Instagram
- Total captures: ${data.captures.length}
- Total photos: ${data.media.length}

VOICE CAPTURES (chronological):
${data.captures.map(c =>
    `[${c.log_date}] ${c.transcription}\n Insights: ${c.insights.map(i => i.content).join(', ')}`
).join('\n\n')}

PHOTOS AVAILABLE:
${data.media.map(m => `[${m.original_date}] ${m.caption || 'Untitled'}`).join('\n')}

TASK:
Create a compelling ${targetLength}-minute video script that tells Rachel's story.

STRUCTURE:

1. Hook (0:00-0:15): Core question - why this matters
2. Origin (0:15-0:45): May 28, 2023 - the awakening
3. Journey (0:45-2:30): The process, struggles, breakthroughs
4. Vision (2:30-3:15): What KI is becoming, why it matters to the world
5. Invitation (3:15-3:30): Call to action

REQUIREMENTS:

- Write in Rachel's authentic voice (first person)
- Be vulnerable and real, not polished marketing speak
- Reference SPECIFIC moments from the captures (include dates)
- Suggest WHICH PHOTOS to show at which timestamps
- Include the struggles and doubts, not just wins
- Make it inspirational but grounded in reality
- Use her language: "Personal Legend," "Capital S Self," "the time is NOW"

OUTPUT FORMAT:
[00:00] Script text here...
[SHOW: photo from 2023-05-28 - journal entry]

[00:15] Next part of script...
[SHOW: photo from 2023-06-12 - early sketch]

Continue for full ${targetLength} minutes...
`;

---

PHASE 8: Story Editor & Export (1 hour)

Goal: Review, edit, export the script

Tasks:

1. Create page: web/app/dashboard/stories/[id]/page.tsx

   - Display generated script
   - Markdown editor for refinement
   - Photo preview thumbnails next to [SHOW: ...] cues
   - Export buttons (Markdown, PDF, TXT)

2. Update API: web/app/api/stories/[id]/route.ts

   - GET: Fetch story
   - PUT: Update script_text
   - Export formats

Story Editor:
┌─────────────────────────────────┐
│ Story: My Journey Building KI │
│ May 28, 2023 - Oct 28, 2024 │
├─────────────────────────────────┤
│ [00:00] │
│ It started with a simple │
│ question... │
│ [SHOW: journal_may28.jpg] [🖼️] │
│ │
│ [00:15] │
│ That summer, something │
│ shifted... │
│ [SHOW: running_photo.jpg] [🖼️] │
│ │
│ [Edit] [Save] [Export ⬇️] │
└─────────────────────────────────┘

---

⏱️ UPDATED TIMELINE

| Phase | Task                       | Time   | Clock Time       |
| ----- | -------------------------- | ------ | ---------------- |
| 1     | Database schema            | 45 min | 9:00pm - 9:45pm  |
| -     | 🧑 YOU: SQL backfill logs  | 1 hr   | 9:45pm - 10:45pm |
| 2     | Mobile: Daily log UI       | 1.5 hr | 9:45pm - 11:15pm |
| 3     | Mobile: Media upload       | 2.5 hr | 11:15pm - 1:45am |
| -     | 🧑 YOU: Upload photos      | 30 min | 1:45am - 2:15am  |
| 4     | Web: Calendar view         | 1 hr   | 1:45am - 2:45am  |
| 5     | Web: Daily log detail      | 1 hr   | 2:45am - 3:45am  |
| 6     | Web: Media library         | 45 min | 3:45am - 4:30am  |
| 7     | Web: AI story generator    | 2.5 hr | 4:30am - 7:00am  |
| 8     | Web: Story editor          | 1 hr   | 7:00am - 8:00am  |
| -     | 🧑 Generate & refine story | 30 min | 8:00am - 8:30am  |

Total: ~11 hours building + 1.5 hours your data entry

---

✅ SUCCESS CRITERIA

By Wednesday 8:30am:

- ✅ Mobile app can set intentions, capture daily thoughts, add reflections
- ✅ Mobile app can upload photos with EXIF dates
- ✅ 20-30 daily logs backfilled via SQL
- ✅ 30-100+ photos uploaded from mobile
- ✅ Web calendar shows your 18-month journey
- ✅ Can view any day's complete log (text + media)
- ✅ AI-generated 3-5 min video script
- ✅ Script references specific dates and suggests photo placements
- ✅ Exportable script ready for recording

Wednesday afternoon:

- Record video with script
- Edit in CapCut with B-roll photos
- Post by 7pm 🎉
