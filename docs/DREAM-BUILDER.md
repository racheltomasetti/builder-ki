Dream Builder: Vision & Technical Specification
Overview
Dream Builder is a personal growth and self-discovery platform that helps individuals capture, synthesize, and share their journey of becoming. Inspired by the concept of the Personal Legend from The Alchemist, it serves as both a thought catcher and dream builder—a system for living your story in real-time, noticing patterns as they emerge, and transforming your experiences into compelling video narratives that inspire and connect.
The platform transforms fleeting thoughts, daily reflections, and captured moments into a living archive of personal growth, enabling users to see their progress, understand their patterns, and ultimately share their learning journeys with the world through the most powerful medium: video storytelling.

Core Philosophy
Capture → Notice → Express → Distill → Share

Capture: Meet users where they are—voice notes, photos, sketches, journal entries—capturing thoughts and moments in their most natural, unfiltered form
Notice: Over time, patterns emerge organically based on what the individual is curious about, learning, and exploring
Express: Bring multiple mediums together—voice, text, images, video—to fully express the richness of experience
Distill: Transform raw fragments into coherent video narratives that reveal the journey, the process, and the transformation
Share: Create compelling story videos that inspire others, build connection, and validate the journey taken

Current State
What Exists Today:

Mobile voice capture (Expo): Record voice notes on mobile device
Transcription & insights: Voice notes are automatically transcribed and analyzed for insights (ideas, decisions, questions, tags/topics)
Web dashboard (Next.js/React/TypeScript): View all transcriptions and voice notes
Document expansion: Create standalone docs or expand voice notes into longer-form documents for deeper exploration
Backend infrastructure (Supabase): Storage for voice notes, transcriptions, insights, and documents

Vision for Expansion

1. Daily Rhythm System
   Purpose: Create a structured daily practice that frames each day with intention and reflection, transforming scattered thoughts into meaningful daily logs.
   Components:
   Morning Intention Setting

Explicit "Set Today's Intention" action in mobile app
Special voice note type: intention
Captures how the user wants to show up for the day
Only one intention per day
Acts as the entry point to the day's capture

Throughout-the-Day Voice Notes

Continuation of existing voice note capture
Automatically associated with the current day
Can only be created after intention is set (gentle structure to encourage the practice)
Captures thoughts, emotions, experiences, breakthroughs, struggles—anything

Evening Reflection & Gratitude

Explicit "Reflect on Today" action in mobile app
Special voice note type: reflection
Captures gratitude, learnings, and closure for the day
Can include what went well, what was challenging, what to carry forward
Only one reflection per day

Daily Log Generation

Automatically aggregates all of a day's content (intention + voice notes + reflection) into a structured daily log
Each daily log represents a complete day: beginning, middle, and end
Forms the building blocks for pattern recognition and video storytelling

Incentive Structure

Daily summary/insight only generated when both intention and reflection are completed
Visual feedback showing progression through the day (intention ✓ → notes → reflection ?)
Gentle prompts/nudges to close out the day
Streak tracking (optional, non-guilt-inducing)
Makes the practice rewarding and creates a desire to complete the daily cycle

2. Media Library System
   Purpose: Expand capture beyond voice to include visual thinking—journal pages, sketches, mind maps, photos, moments—creating a multimedia archive of the journey.
   Components:
   Mobile Media Upload

Camera capture within app (take photo now)
Camera roll selection (upload existing photos/videos)
Support for images and videos
Extract and preserve EXIF metadata (especially original capture date)

Date Association

Automatic association with daily logs based on capture date
Manual association option: attach media to specific days from timeline
Bulk uploads that exist independently in media library
Flexible: media can exist standalone or be tied to daily context

Web Media Library

Grid view of all uploaded media
Timeline view organized by date
Filter by date range, tags, associated/unassociated
Tag and caption management
Full-size viewing with metadata display
Search functionality
Preview videos before using in stories

Integration with Daily Logs

Media associated with a specific day appears in that day's log view
Provides visual context to voice notes and reflections
Creates richer daily logs that include both audio and visual capture
Serves as B-roll library for video stories

3. Pattern Recognition & Synthesis
   Purpose: Help users notice themes, cycles, and evolution over time—seeing the shape of their journey as it emerges.
   Components:
   Temporal Views

Calendar view showing all days with logs
Week view: see 7 days at a glance with emerging themes
Month view: broader patterns across 30 days
Custom date range views

Tag & Topic Analysis

Frequency analysis: which topics appear most often
Evolution tracking: how topics change over time
Clustering: related tags and themes that appear together
Visual representations (tag clouds, frequency graphs, timelines)

Cycle Tracking Integration (Opt-in)

User inputs menstrual cycle start date and typical cycle length
Daily logs automatically tagged with cycle phase (follicular, ovulation, luteal, menstrual)
Pattern recognition across cycle phases
Insights like: "You tend to journal about creativity during ovulation" or "More introspective reflection during luteal phase"
Respects the reality that women's experiences, energy, and focus shift throughout the month

Weekly & Monthly Recaps

Auto-generated or on-demand summaries
Highlights: key moments, breakthroughs, recurring themes
Emotional/energy mapping across time
What shifted, what stayed constant, what emerged

Emerging Patterns Dashboard

Surface insights: "You've mentioned 'trust' in 15 notes over 4 weeks"
Suggest connections between seemingly disparate entries
Show trajectory: how thinking has evolved on specific topics
Non-intrusive: suggestions that inspire exploration, not prescriptive analysis

4. Video Story Studio
   Purpose: Transform raw fragments—daily logs, voice notes, media, insights—into compelling video narratives that tell the story of specific learning journeys and share them with the world.
   Components:
   Story Creation & Narrative Crafting

User-initiated: "I want to create a video about [theme/journey]"
Examples: "Why I'm Building This," "Learning to Code in Public," "My Journey with Intuition," "Building My First Business"
Can be time-bounded (Jan-March 2025) or theme-bounded (ongoing exploration)
Each story video is a curated narrative with clear arc

AI Script Assistant

Content Discovery: System analyzes user's daily logs, voice notes, and documents

Filter by date range, tags, themes, cycle phase
Surface relevant moments: breakthroughs, struggles, decisions, insights
Show emotional arc across selected timeframe
Identify recurring themes and patterns
Suggest key moments that would make compelling story beats

Narrative Structure Generation: AI helps craft story arc

Hook: Why this story matters, what question it answers
Background: Context and starting point
Journey: The ups and downs, the process, the learning
Breakthrough/Transformation: What shifted, what was learned
Vision/Call-to-Action: Where you're going, invitation to others
Customizable structures: Hero's Journey, Problem-Solution, Timeline, Thematic

Script Writing:

Generate initial script draft based on selected logs and structure
Pull direct quotes from voice note transcriptions
Suggest transitions between story beats
Estimate timing for target video length (1min, 3min, 5min, 10min)
Markdown editor for user refinement
Side-by-side view: script + source material (logs, notes)
Version history: iterate on script drafts

B-Roll Suggestions:

Analyze script and suggest media from library for each section
"When you talk about early sketches (00:15-00:30), show these 3 images"
Smart matching based on dates, tags, and content
Preview suggested B-roll alongside script

Teleprompter Mode:

Full-screen script display
Auto-scroll at adjustable speed
Large, readable text
Timestamp markers for B-roll cues
Practice mode with timer

Video Recording Studio

In-App Recording (Mobile & Web):

Camera interface with script overlay/teleprompter
Record in multiple takes/segments
Pause and resume functionality
Review takes before proceeding
Flip camera (selfie/rear)
Audio level monitoring

Import Existing Video:

Upload pre-recorded video from device
Support multiple video clips
Extract audio for transcription
Analyze video duration and suggest pacing

Recording Guidance:

Framing guides (rule of thirds, eye line)
Lighting tips
Audio quality feedback
Suggested takes for different delivery styles

Video Editor Interface

Timeline View:

Visual timeline of video duration (measured in seconds/minutes)
Waveform display for audio reference
Timestamp markers every 5-10 seconds
Scrubber for precise navigation
Playback controls (play/pause, speed adjustment)
Zoom in/out on timeline for precision editing

Main Video Track:

Primary video of user telling their story
Support for multiple clips (if recorded in segments)
Trim/cut functionality (start/end points)
Clip arrangement and reordering
Transition options between clips (cut, fade)

B-Roll/Media Layer:

Secondary track below main video
Drag media from library onto timeline at specific timestamps
Multiple overlay types:

Picture-in-Picture: Small image/video in corner of screen
Split Screen: Show media alongside video
Full Screen Insert: Replace video with media for duration
Background: Show media behind semi-transparent video

Adjust duration of each overlay (drag handles to extend/shorten)
Position and scale overlays (corner placement, size)
Multiple overlays can exist at different timestamps

Text & Caption Layer:

Add text overlays at any timestamp
Subtitle/caption support (auto-generated from script or manual)
Lower thirds (name, title, context labels)
Key quotes or highlights from script
Animated text options (fade in/out, slide)
Font, size, color, positioning customization

Media Library Panel:

Grid/list view of all uploaded photos and videos
Filter by date, tags, used/unused
Search functionality
Thumbnail preview on hover
Metadata display (date taken, tags, caption)
Drag-and-drop to timeline
Mark favorites for quick access
Smart suggestions based on script analysis

Audio Editing:

Background music track (upload or from library)
Volume controls for main video audio and music
Fade in/fade out for music
Audio ducking (lower music when speaking)
Voiceover recording option (narrate over B-roll)
Audio sync tools if using separate audio

Preview & Playback:

Full preview mode (see exactly how video will look)
Render preview (with all effects applied)
Play from any point on timeline
Loop specific sections for refinement
Real-time preview (fast but lower quality)
Final preview (slower but accurate)

Project Management:

Auto-save as you edit
Save multiple versions/drafts
Duplicate project to try alternative edits
Project history/undo stack
Export settings (resolution, format, quality)

AI Enhancement Tools

Auto-Edit Suggestions:

Based on script, automatically place B-roll at relevant moments
Suggest pacing (when to cut, when to let moments breathe)
Identify and remove filler words/pauses (optional)
Recommend music tempo based on story mood

Visual Style Transfer (Future Enhancement):

Apply consistent visual treatment to B-roll
Color grading presets (warm, cool, dramatic, vintage)
Filters and effects matching your aesthetic

Caption Generation:

Auto-generate captions from script/transcription
Highlight key phrases
Format for social media (word emphasis, emojis)
Multi-language subtitle support

Smart Cropping:

Auto-detect and crop for different aspect ratios
16:9 (YouTube), 9:16 (TikTok/Reels), 1:1 (Instagram)
Face tracking to keep subject centered
Generate multiple versions for different platforms

Export & Publishing

Export Options:

Video file formats (MP4, MOV)
Resolution options (1080p, 4K, optimized for web)
Aspect ratio selection (16:9, 9:16, 1:1, 4:5)
Quality/file size balance
Render queue for multiple exports

Platform-Specific Optimization:

LinkedIn: 3-5 min, professional tone, 16:9 or 1:1
Instagram Feed: 60s max, 1:1 or 4:5
Instagram Reels: 15-90s, 9:16, dynamic
TikTok: 15-180s, 9:16, captions essential
YouTube: Longer form, 16:9, chapters/timestamps
Twitter: <2:20, 16:9 or 1:1, captions helpful

Metadata & SEO:

Title, description, tags for each platform
Thumbnail generation (pull frame or custom upload)
Hashtag suggestions
Call-to-action text

Direct Publishing (Future Enhancement):

Post directly to platforms via API integration
Schedule posts for optimal timing
Cross-post to multiple platforms
Track engagement metrics

Shareable Preview Links:

Private preview link for feedback before publishing
Password protection option
Track views and watch time
Gather feedback/comments

Story Management

Story Library:

View all created story videos
Filter by status (draft, completed, published)
Search by title, theme, date created
Thumbnail previews
Quick stats (duration, views if published)

Templates & Starting Points (Future Enhancement):

Story templates: "My Why," "90-Day Journey," "Lessons Learned," "Behind the Scenes"
Script templates with fill-in-the-blanks
Suggested B-roll patterns
Music suggestions by story type
Example videos from other users (with permission)

Collaboration (Future Enhancement):

Share story draft with trusted reviewers
Collect feedback and suggestions
Co-create stories (interview format, dual perspective)
Guest appearances in each other's stories

5. Community & Discovery (Future Phase)
   Purpose: Create connection and inspiration through shared stories while maintaining privacy and authenticity.
   Components:
   Public Story Gallery

Discover page: publicly shared story videos
Filter by theme, length, recent/popular
Search by keywords or topics
Watch stories from other journeyers
Like, comment, share functionality

Creator Profiles

Public profile for those who want to share their journey
Collection of published story videos
About section articulating their Personal Legend
Follow other creators
Notification when they publish new stories

Story Collections & Series

Group related story videos into series
"My 365-Day Journey" (daily or weekly stories)
"Learning X" (multi-part series on specific skill/topic)
Binge-watch experience for followers

Inspiration & Connection

Comment with encouragement and resonance
"This story inspired me" reactions
Share stories that moved you
Connect with others on similar journeys
Private messaging for deeper connection

Privacy Controls

Default private: stories only visible to you
Selective sharing: unlisted link for specific people
Public publishing: opt-in to gallery
Control who can comment
Remove from public at any time

System Architecture
Data Model
Core Entities:
voice_notes (existing, to be extended)

id: unique identifier
user_id: owner
note_type: NEW - 'intention' | 'daily' | 'reflection' | 'general'
log_date: NEW - date this note belongs to
transcription: text content
insights: extracted ideas, decisions, questions, tags
audio_url: link to stored audio file
created_at: timestamp

documents (existing)

Created from voice notes or standalone
Long-form exploration and articulation
Linked to original voice note if applicable

media_items (new)

id: unique identifier
user_id: owner
file_url: stored file location
file_type: image, video, pdf, audio
original_date: from EXIF data or user specification
upload_date: when uploaded to system
log_date: optional association with specific daily log
caption: user-added description
tags: array of keywords
duration: for video/audio files
dimensions: for images/videos
metadata: EXIF data, dimensions, file size, etc.

daily_logs (new)

id: unique identifier
user_id: owner
date: the day this log represents
intention_note_id: reference to morning intention
reflection_note_id: reference to evening reflection
daily_note_ids: array of voice notes captured during the day
media_ids: array of media associated with this day
cycle_phase: optional, for users tracking menstrual cycle
completed: boolean, has both intention and reflection
ai_summary: optional generated daily summary

video_stories (new)

id: unique identifier
user_id: creator
title: story name
description: what this story is about
theme_tags: array of primary themes
date_range: optional start/end dates if time-bounded covering which logs/content
script_text: markdown script for story (from AI assistant)
script_metadata: structure, key moments, timing estimates
video_clips: array of video file references (main footage)
timeline_data: complete editing timeline (JSONB)
export_settings: resolution, aspect ratio, platform optimizations
status: 'draft' | 'editing' | 'rendering' | 'completed' | 'published'
published_url: URL if shared publicly
privacy_level: 'private' | 'unlisted' | 'public'
created_at: timestamp
updated_at: timestamp
published_at: timestamp
duration: final video length in seconds
thumbnail_url: preview image
view_count: engagement metric
version: version number for iterations

Timeline Data Structure (within timeline_data JSONB):
json{
"video_track": [
{
"clip_id": "uuid",
"start_time": 0,
"end_time": 45.5,
"trim_start": 2.3,
"trim_end": 48.1,
"transition": "fade"
}
],
"media_overlays": [
{
"media_id": "uuid",
"start_time": 12.5,
"duration": 5.0,
"type": "picture-in-picture",
"position": "bottom-right",
"scale": 0.3,
"animation": "fade-in"
}
],
"text_overlays": [
{
"text": "Day 1: The Beginning",
"start_time": 0,
"duration": 3.0,
"style": "lower-third",
"font": "Inter",
"size": 24,
"color": "#FFFFFF"
}
],
"audio_tracks": [
{
"type": "background-music",
"file_url": "url",
"start_time": 0,
"volume": 0.3,
"fade_in": 2.0,
"fade_out": 2.0
}
]
}
video_clips (new)

id: unique identifier
story_id: parent video story
user_id: owner
file_url: stored video file location
duration: length in seconds
resolution: width x height
file_size: bytes
recorded_at: timestamp
recording_method: 'in-app' | 'uploaded' | 'imported'
transcription: auto-generated from audio
order: sequence in multi-clip stories

cycle_tracking (new, opt-in)

user_id: owner
cycle_start_date: most recent cycle start
cycle_length: typical cycle length in days
phase_preferences: optional notes about each phase

story_templates (future)

Pre-built story structures
Script templates
Suggested media patterns
Example videos

community_interactions (future)

Likes, comments, shares on public stories
Follow relationships
Engagement metrics

Technical Stack
Mobile: Expo (React Native)
Web: Next.js, React, TypeScript
Backend: Supabase (PostgreSQL, Storage, Auth, Realtime)
Video Storage: Supabase Storage (or Cloudflare R2 for scale)
Video Processing:

Client-side: ffmpeg.wasm (for lightweight edits)
Server-side: FFmpeg (for production rendering)
Alternative: Mux, Cloudinary, or similar video API
AI Services:
Transcription: (existing service)
Insights extraction: (existing service)
Script generation: Claude API, GPT-4, or similar
Future: Auto-captioning, smart editing suggestions

Feature Dependencies & Build Sequencing
Foundation (Existing)

Voice capture and transcription
Web dashboard
Document creation and editing
Basic storage and retrieval

Phase 1: Daily Rhythm
Depends on: Foundation
Enables: Daily logs, structured capture, temporal views, better source material for stories
Components:

Note type classification
Intention/reflection UI and logic
Daily log creation and aggregation
Calendar view
Daily log detail view
Completion tracking and incentives

Phase 2: Media Library
Depends on: Foundation
Enhances: Daily logs (visual context), Video stories (B-roll library)
Components:

Mobile media upload (camera + roll)
EXIF extraction and video metadata
Media storage and management
Web media library interface
Association with daily logs
Tagging and organization
Video preview and playback

Phase 3: Pattern Recognition
Depends on: Daily Rhythm
Enhances: User insight, Video stories (content discovery for scripts)
Components:

Tag analysis and clustering
Temporal views (week, month, cycle)
Cycle tracking (opt-in)
Pattern detection algorithms
Emerging themes dashboard
Weekly/monthly recaps

Phase 4: Video Story Studio - Script Assistant
Depends on: Daily Rhythm, Media Library
Enhanced by: Pattern Recognition (better content suggestions)
Components:

Video story entity and data model
AI script assistant interface
Content discovery and filtering
Narrative structure generation
Script drafting and editing
B-roll suggestion engine
Teleprompter mode
Script export

Phase 5: Video Story Studio - Recording & Upload
Depends on: Script Assistant
Components:

In-app video recording (mobile & web)
Camera interface with teleprompter overlay
Multi-take recording support
Video file upload
Video clip management
Video playback and preview
Transcription of recorded video

Phase 6: Video Story Studio - Editor
Depends on: Recording & Upload, Media Library
Components:

Video editor interface (timeline, tracks, panels)
Main video track editing
B-roll/media overlay system
Text and caption layers
Audio editing (music, ducking)
Preview and playback functionality
Project management (save, versions, undo)
Rendering engine (client or server-side)

Phase 7: Video Story Studio - AI Enhancement
Depends on: Editor
Components:

Auto-edit suggestions based on script
Caption auto-generation
Smart cropping for multiple aspect ratios
Visual style transfer and filters
Pacing and timing optimization

Phase 8: Export & Publishing
Depends on: Editor
Components:

Multi-format export (MP4, various resolutions)
Platform-specific optimization
Thumbnail generation
Metadata and SEO tools
Shareable preview links
Future: Direct publishing to social platforms

Phase 9: Community & Discovery (Future)
Depends on: Complete Video Story Studio
Components:

Public story gallery
Creator profiles
Social features (like, comment, share)
Story collections and series
Privacy controls and moderation

User Journeys
Journey 1: Daily Practice Building Foundation

Morning: Wake up, open app, set intention for the day
Throughout day: Capture thoughts, moments, experiences via voice
Midday: Upload photo of journal page with sketch
Evening: Reflect on day, express gratitude
Completion: See daily summary generated, streak maintained
Web: Later, review day's log in calendar, see photos alongside voice notes
Over time: Accumulate rich archive of daily logs with voice and visual content

Journey 2: Creating Your First Story Video
Pre-Production (Script Creation)

Inspiration: After weeks of capturing daily logs, ready to share a story
Navigate: Go to web dashboard → "Create New Story Video"
Setup: Title: "Why I'm Building Dream Builder" | Target length: 3 minutes
AI Discovery: System analyzes last 30 days of logs

Highlights 12 relevant voice notes about vision, purpose, breakthroughs
Shows 8 photos/sketches from the building process
Suggests story structure: Hook → Origin → Journey → Vision → Invitation

Script Generation: AI drafts initial script

"It started with a simple question: What if we could capture our becoming?"
Pulls quote from Day 7 voice note about frustration with existing tools
References breakthrough moment from Day 15
Weaves in vision from intention-setting voice notes

Refinement: User edits script in own voice, adds personal touches
B-Roll Planning: AI suggests which photos to show at each script moment

00:15-00:30: Show initial sketches when talking about early vision
00:45-01:00: Show journal entry photo during struggle section
01:30-01:45: Show screenshots of first prototype

Teleprompter: Review script in full-screen mode, practice delivery

Production (Recording) 9. Recording Setup: Open in-app recorder with script visible 10. Record: Film 3-minute video telling the story

- Script scrolls automatically as you speak
- Timestamp cues remind when B-roll moments coming
- Record in 2-3 takes to get it right

11. Review: Watch back, decide on best take
12. Upload: Save video to story project
    Post-Production (Editing)
13. Editor Interface: Video appears in timeline view
14. Add B-roll:

- Scrub to 00:15, drag initial sketch photo → picture-in-picture bottom-right
- Scrub to 00:45, drag journal entry → full-screen insert for 5 seconds
- Continue adding 6-8 B-roll moments throughout

15. Add Text Overlays:

- Opening title card: "My Personal Legend"
- Lower thirds when introducing key concepts
- Key quote highlight: "Extension of the mind"

16. Audio Enhancement:

- Add subtle background music (instrumental, inspiring)
- Set volume to 20% so it doesn't overpower voice
- Auto-duck music when speaking

17. Preview: Watch full video with all elements
18. Refine: Adjust timing on two B-roll moments, extend one by 2 seconds
19. Final Preview: Looks great!
    Publishing (Sharing)
20. Export Settings:

- LinkedIn version: 16:9, 1080p, 3:12 duration
- Instagram Reel version: 9:16, 1080p, auto-cropped, captions added

21. Render: Export both versions (takes 5-10 minutes)
22. Metadata:

- LinkedIn: Professional description, hashtags #BuildInPublic #PersonalGrowth
- Instagram: Casual caption, more hashtags

23. Thumbnail: Select frame at 00:05 where you're smiling
24. Publish:

- Upload to LinkedIn: "I've been building something deeply personal..."
- Share to Instagram Reels: "Your journey matters. Here's mine."

25. Share: Post goes live, engagement starts rolling in
26. Impact: Comments: "This resonates so deeply" | "I need this tool" | "Your vulnerability is inspiring"
    Journey 3: Iterating Your Story

Week Later: Video performed well, but want to create updated version
Story Library: Find original story, click "Duplicate"
Update: Title now "Dream Builder: Week 2 Progress"
New Content: Past week's daily logs show new developments
Revised Script: AI helps extend story with new chapter
Quick Edit: Add 30 seconds at end showing progress since first video
B-Roll: Include new photos from recent building sessions
Export: Create follow-up video
Post: "Update: Here's what I've learned since sharing..."
Series: Now have 2-part story series documenting the journey

Journey 4: Discovering Patterns Through Video Creation

Monthly Review: Been capturing daily logs for 3 months
Pattern Notice: Tags show "creativity" appearing frequently in mornings during ovulation
Story Idea: "How I Learned to Work With My Cycle"
Script Creation: AI filters logs by cycle phase

Follicular: High-energy building, new ideas
Ovulation: Peak creativity, social sharing
Luteal: Detailed refinement, systems thinking
Menstrual: Rest and reflection

Create Video: Share this discovery with other women
Impact: Resonates deeply with audience experiencing same pattern
Community: Connect with others exploring cycle-aware living

Success Metrics
Daily Practice Metrics

Daily log completion rate (intention + reflection)
Voice notes per day average
Media uploads per week
Streak length distribution
Time between app opens
Percentage of days with completed logs

Content Archive Metrics

Total daily logs created
Average notes per log
Media items in library
Documents created from voice notes
Tags generated and used
Archive growth over time

Video Story Creation Metrics

Number of story videos created
Scripts generated via AI assistant
Time from script to published video
Average video duration
B-roll moments per video
Aspect ratios exported (platform diversity)
Stories in draft vs. completed status

AI Assistance Utilization

Script assistant usage rate
B-roll suggestions accepted
Caption generation usage
Auto-edit features adopted
User edits to AI suggestions (indicates quality)

Sharing & Engagement Metrics

Videos exported
Platform distribution (LinkedIn, Instagram, etc.)
Videos published publicly
Views on published videos (if hosted)
Engagement on social platforms (external tracking)
Shareable preview link views
Story remixes/iterations (v1, v2, v3 of same story)

Pattern Recognition Metrics

Users who enable cycle tracking
Pattern dashboard views
Content discovery via filters
Tag-based story creation
Date range selections for stories

User Journey Metrics

Time to first video story completed
Scripts created before first recording
Recording attempts before successful video
Average editing time per video
Days from daily log to story video inclusion
Repeat video creators (1, 5, 10+ videos)

Qualitative Metrics

User testimonials about self-discovery through video creation
Stories shared publicly and their reception
Community feedback and comments
Examples of life/career impact from sharing stories
Press coverage or social media virality
Partnerships or collaborations formed through shared stories

Design Principles

1. Friction Where It Matters

Gentle structure (intention → notes → reflection) creates meaningful practice
Intention requirement before daily notes encourages mindfulness
Script creation process encourages thoughtful narrative before recording
Not punitive—just enough friction to create intentionality

2. Capture Without Judgment

Voice as primary input: fast, natural, unfiltered
Camera always ready for quick captures
No "right way" to use the system
System adapts to user's natural curiosity and focus
Accepts messiness and non-linearity in daily logs
Raw footage is celebrated, not judged

3. Progressive Enhancement

Core value at each phase: daily practice stands alone
Media library enhances but doesn't require daily logs
Video stories pull from archive but archive valuable independently
Each layer adds capability without complicating base experience
Users can engage at their chosen depth
Can use just for personal reflection or go all-in on public storytelling

4. User as Creator

AI assists but never takes over
User maintains creative control over script and edits
System surfaces possibilities, user makes choices
Video editor is tool, not autopilot
Celebrates user's voice, vision, and agency
Unique perspective is the product

5. Story as Connection

Video is the most powerful medium for sharing human stories
Authentic vulnerability creates resonance
Behind-the-scenes process (B-roll from logs) builds trust
Personal Legend inspires others to pursue theirs
Sharing journey validates the struggle and growth
Community forms around shared becoming

6. Privacy First, Sharing Optional

Personal growth is inherently vulnerable
Default private, explicit choice to share
User controls what leaves the system
Safe space for authentic expression
Can create videos just for self without pressure to publish
Shareable previews allow trusted feedback before public posting

7. Beautiful by Default

Visual design honors the content and creator
Clean, uncluttered interfaces
Thoughtful typography and spacing
Video exports are presentation-ready
Templates ensure professional quality
User looks good when sharing their story

8. Respect Natural Rhythms

Daily cycle (morning/evening)
Weekly patterns
Monthly/cycle patterns (for those who track)
Seasonal evolution
Non-linear growth acknowledged and celebrated
Video stories can document any timeframe that matters

9. Build in Public Philosophy

Tool itself embodies "building in public"
Makes it easy to share the messy middle
Encourages iteration and transparency
Documents journey, not just highlights
Validates that process matters as much as outcome
Creates accountability and community

Technical Considerations
Video Processing Challenges
Client-Side Processing:

Pros: No server costs, immediate feedback, user privacy
Cons: Limited by device capability, slower rendering, format restrictions
Best for: Preview mode, simple overlays, lightweight edits
Tools: ffmpeg.wasm, canvas API for compositing

Server-Side Processing:

Pros: Fast, reliable, handles complex effects, consistent output
Cons: Server costs scale with usage, upload/download time, privacy considerations
Best for: Final rendering, multi-track compositing, format conversion
Tools: FFmpeg, dedicated video APIs (Mux, Cloudinary)

Hybrid Approach (Recommended):

Preview/scrubbing: Client-side for instant feedback
Final export: Server-side for quality and speed
Iterative workflow: Client for adjustments, server for commits

Storage & Bandwidth
Video Storage:

Raw video uploads: Large files (100MB-1GB per video)
Multiple takes/clips per story
Rendered final videos: Moderate (20-200MB depending on length/quality)
Supabase Storage: 100GB free tier (upgrade as needed)
Alternative: Cloudflare R2 (cheaper for large-scale)

Bandwidth Considerations:

Upload: Mobile users may be on cellular (provide compression options)
Download: Streaming video in editor (adaptive quality)
Export: Render server should have good upload speed
CDN: Serve final videos via CDN for performance

Performance Optimization
Timeline Scrubbing:

Use video thumbnail strip (preview images every N seconds)
Lazy load media library (virtualize large lists)
Debounce timeline updates while dragging
Cache rendered frames for repeated playback

Rendering Pipeline:

Queue system for export jobs
Progress tracking and status updates
Retry logic for failed renders
Cleanup temporary files
Email notification when render complete

Mobile App Performance:

Compress videos before upload (user-configurable quality)
Background upload support (don't block app use)
Offline draft support (save edits locally, sync later)
Reduce battery drain during recording

Data Integrity
Version Control:

Auto-save editing progress every N seconds
Store complete timeline_data snapshots
Allow rollback to previous versions
Prevent data loss from crashes or network issues

Media Management:

Reference counting for media (don't delete if used in stories)
Orphan cleanup (remove unused uploaded files)
Backup raw uploads before processing
Maintain original + processed versions

Scalability Considerations
Database:

JSONB timeline_data can grow large (monitor query performance)
Index frequently queried fields (user_id, status, created_at)
Archive old drafts to cold storage
Partition by user for large-scale

Processing Queue:

Start with simple queue (Supabase functions)
Scale to dedicated worker pool (BullMQ, AWS Lambda)
Prioritize paid users or urgent exports
Rate limiting to prevent abuse

Cost Management:

Video storage is expensive (implement retention policies)
Rendering compute is expensive (optimize FFmpeg flags)
Bandwidth is expensive (CDN caching, smart compression)
Consider tiered pricing based on video volume

Future Enhancements (Beyond MVP)
Advanced Editing Features

Multi-cam support (switch between angles)
Green screen / background replacement
Advanced transitions and effects
Audio noise reduction and enhancement
Color grading tools
Speed ramping (slow motion, time lapse)
Zoom and pan animations (Ken Burns effect)
Stickers and animated elements

AI-Powered Features

Auto-highlight detection (find best moments in raw footage)
Sentiment analysis for music matching
Face/object tracking for automatic framing
Voice cloning for voiceover corrections
Auto-generate multiple video variants (A/B testing)
Predictive editing suggestions based on successful stories
Transcript-based editing (edit video by editing text)

Collaboration & Feedback

Real-time collaborative editing (multiple editors)
Comment on specific timestamps (feedback loop)
Approval workflows (for teams/clients)
Guest appearances (record with others, split-screen)
Interview mode (question + answer format)
Duet/reaction videos (respond to others' stories)

Analytics & Insights

View analytics for published videos (if hosted)
Audience retention graphs (where viewers drop off)
Engagement heatmaps (most replayed sections)
A/B testing different cuts/thumbnails
Social media performance tracking
Conversion tracking (if using for business)

Monetization & Business Features

Premium subscription (more storage, advanced features, priority rendering)
Template marketplace (buy/sell story templates)
White-label for coaches/creators (use for client work)
Affiliate/sponsor integration (product placements in videos)
Licensing for stock footage/music
Export for clients (coach helping clients create stories)

Platform Integrations

Direct publish to YouTube, TikTok, LinkedIn, Instagram
Auto-post to Twitter threads (break video into clips)
Newsletter integration (embed videos in Substack, Beehiiv)
Podcast generation (extract audio as episode)
Blog post generation (transcript + screenshots as article)
Zapier/Make integration for automation

Community Features

Public creator profiles
Story collections and playlists
Collaborative stories (shared journeys)
Mentorship (experienced creators helping new ones)
Challenges and prompts ("30-day storytelling challenge")
Awards and recognition (featured stories)
Events and workshops (story creation workshops)

Launch Strategy & Validation
Phase 1: Solo Use & Iteration

Build MVP for personal use (deadline: Wednesday 7pm)
Use tool daily to capture own journey
Create first story video and publish
Gather own insights on friction points
Refine based on lived experience

Phase 2: Trusted Beta (10-20 Users)

Invite close friends and fellow builders
Guide them through daily practice setup
Support them in creating their first story video
Collect detailed feedback via interviews
Identify common struggles and delights
Iterate rapidly based on feedback

Phase 3: Expanded Beta (100-200 Users)

Open waitlist and invite in waves
Onboarding flow and documentation
Community space for beta users (Discord/Slack)
Weekly office hours and tutorials
Showcase user-created videos
Refine based on patterns across users

Phase 4: Public Launch

Open registration (free tier + paid premium)
Marketing campaign showcasing user stories
Press outreach to productivity/creator/self-development media
SEO and content marketing (blog, guides, examples)
Partnerships with coaches, creators, educators
Community growth and engagement

Why This Matters
Most personal growth tools focus on either:

Capture (journaling apps): You collect but never synthesize or share
Tracking (habit trackers): You measure but lose the narrative and human story
Community (social platforms): You share but lose authenticity and depth
Analysis (quantified self): You analyze but lose the emotional and creative expression

Dream Builder integrates all of these while keeping the human story at the center. It honors the mess and non-linearity of real growth while providing structure that reveals patterns and meaning. It uses AI to accelerate the creative process, not replace it. Most importantly, it transforms personal reflection into shareable stories that inspire and connect.
The Power of Video Storytelling
Video is the most powerful medium for human connection because:

Presence: Seeing someone's face and hearing their voice builds trust and intimacy
Emotion: Tone, expression, and body language convey nuance that text cannot
Authenticity: Raw, unpolished video feels more real than perfectly crafted writing
Accessibility: Video is easier to consume than long-form text (especially mobile)
Virality: Social platforms prioritize video in algorithms
Impact: Personal stories told through video inspire action and change in viewers

By making it easy to transform daily reflections into compelling video narratives, Dream Builder empowers everyone to become a storyteller of their own becoming.
Building in Public
Dream Builder itself embodies the philosophy it promotes:

Transparency: The tool helps document the messy, non-linear journey
Vulnerability: Encourages sharing struggles, not just wins
Community: Stories inspire and connect others on similar paths
Accountability: Public sharing creates commitment to the journey
Learning: Process documentation helps others learn from your path

Validating the Journey
Most importantly, Dream Builder validates the journey itself. By creating beautiful, shareable videos from daily practice, it affirms that:

The process of becoming is worth documenting
Every person's Personal Legend matters and deserves to be told
Growth is not linear—the ups and downs are part of the story
Sharing our journeys makes us all more human
Your story can inspire someone else to begin theirs

Closing Vision
Dream Builder is a tool for people who believe in their own becoming. For those who know that growth is not a straight line, that wisdom emerges from reflection, that patterns reveal themselves over time, and that sharing our journeys through authentic video storytelling creates connection and inspiration.
It's for the person who wakes up with intention, who notices their thoughts throughout the day, who reflects with gratitude in the evening. Who takes photos of their messy journal pages and sketches because those contain something true. Who wants to understand their cycles, honor their rhythms, and see their evolution over time.
It's for the person who has a story to tell and wants to share it with the world. Who knows that video is how stories spread and connect. Who is willing to be vulnerable, to show the behind-the-scenes, to document the process and not just the outcome.
It's for the person who wants tools that accelerate their creativity, not replace it. Who wants AI to help craft their narrative while maintaining their unique voice and vision. Who wants to turn their daily reflections into something they're proud to share on LinkedIn, Instagram, YouTube—anywhere stories live.
It's for the person building their Personal Legend, one voice note at a time, one day at a time, and now—one story video at a time.
This is what we're building. This is Dream Builder.

# MVP PLAN FOR TONIGHT

What We're Building in the Next 24 Hours
Part 1: Daily Log Foundation (4-6 hours)
Enable you to structure your journey temporally
Database:

Update voice_notes table: add note_type and log_date fields
Create daily_logs table: date, intention, reflection, notes array, media array
Migration script to preserve existing data

Backfill Process:

Script to help you quickly create daily logs from your journal entries
Simple form: date → paste text → save as daily log
Fast data entry (aim for 15-30 logs covering key moments from May 2023 - now)
Don't need every single day, just the meaningful ones that tell your story

Web Dashboard:

Calendar view showing which days have logs
Daily log detail page: see all content for a specific day
Quick create/edit interface for backfilling

Part 2: Bulk Media Upload with Date Association (2-3 hours)
Give visual landmarks to your journey
Upload Flow:

Drag-and-drop multiple images at once
Extract EXIF date from each photo
Automatically associate with daily log for that date (if exists)
If no log for that date, just store with date metadata
Web interface: see media organized by date

Calendar Integration:

When viewing a daily log, see all media from that day
Visual timeline: scroll through dates, see photos appear

Part 3: AI Story Narrative Generator (4-6 hours)
The core magic: transform logs into your story
Story Builder Interface:

New page: "Create Story"
Input form:

Story title
Date range (May 2023 - October 2024)
Key themes/topics (optional filters)
Target output length (500 words, 1000 words, script format)

AI Processing:

Query all daily logs in date range
Query all voice notes and their insights
Query all media items with dates
Send to Claude API with prompt:

"Here is 18 months of daily logs, voice notes, and photos from someone's journey building Dream Builder"
"Craft a compelling narrative that tells the story of this journey"
"Identify: the catalyst, the struggles, the breakthroughs, the vision"
"Format as: [Script / Essay / Outline] with timestamps for when to reference specific moments"

Output:

Generated narrative in markdown
Includes references to specific daily logs by date
Suggests which photos to show at which points in the story
Editable by you (AI draft, you refine)
Export as script for your video

Tonight's Build Timeline
Hours 1-3: Database + Backfill Tool (9pm-12am)

Create daily logs schema
Build simple backfill interface
YOU START BACKFILLING while I build Part 2

Hours 4-6: Media Upload (12am-3am)

Build bulk upload with EXIF extraction
Calendar view with media
YOU UPLOAD YOUR PHOTOS while I build Part 3

Hours 7-10: Story Generator (3am-6am)

Build AI narrative generator
Test with your backfilled data
Iterate on prompts until output is great

Hour 11: Generate Your Story (6am-7am)

Run story generator on your full journey
Get draft narrative
YOU REFINE AND FINALIZE throughout the morning

Wednesday Day: Record & Edit

You have your script
Record video using your script
Use existing tools (CapCut/iMovie) to add your uploaded photos at suggested timestamps
Export by 7pm

What This Enables
Tonight you build the system that:

✅ Structures your 18-month journey into temporal daily logs
✅ Attaches your photos to specific moments in time
✅ Uses AI to synthesize all of this into a coherent narrative
✅ Gives you a script/story you can record tomorrow

Wednesday you:

✅ Record yourself telling that story
✅ Add photos from your journey as B-roll using existing video tools
✅ Post to LinkedIn/Instagram by 7pm
✅ Share your Personal Legend with the world

After Wednesday you:

Have validated the core concept with a real story
Have a working daily log system you can actually use going forward
Can build the fancy video editor, more AI features, etc. based on what you learned

Technical Specs for Tonight
Database Migration
sql-- Add fields to voice_notes
ALTER TABLE voice_notes
ADD COLUMN note_type TEXT DEFAULT 'general',
ADD COLUMN log_date DATE;

-- Create daily_logs table
CREATE TABLE daily_logs (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id),
date DATE NOT NULL,
intention_text TEXT,
reflection_text TEXT,
notes_text TEXT, -- For backfilled content
voice_note_ids UUID[],
media_ids UUID[],
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW(),
UNIQUE(user_id, date)
);

-- Create media_items table  
CREATE TABLE media_items (
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
user_id UUID REFERENCES auth.users(id),
file_url TEXT NOT NULL,
file_type TEXT NOT NULL,
original_date DATE,
caption TEXT,
tags TEXT[],
created_at TIMESTAMP DEFAULT NOW()
);
Backfill Interface (Simple Form)
tsx// /pages/backfill.tsx

- Date picker
- Big text area for content (paste journal entry)
- "Save as Daily Log" button
- Shows list of created logs below
- Click to edit existing log
  Media Upload
  tsx// /pages/media/upload.tsx
- Drag-drop multiple files
- Client-side EXIF extraction (exifr library)
- Upload to Supabase storage
- Create media_items records with dates
- Show success confirmation with dates extracted
  Story Generator API
  tsx// /pages/api/stories/generate.ts
- POST request with date range, themes
- Query Supabase for logs and media in range
- Format data for Claude API
- Prompt: "You are a story consultant helping someone share their journey..."
- Return: generated narrative with references to specific dates/photos
  Story Generator UI
  tsx// /pages/stories/create.tsx
- Form: title, date range, themes, output format
- "Generate Story" button
- Loading state (may take 30-60 seconds)
- Display generated narrative
- Rich text editor for refinement
- Export buttons (markdown, PDF, plain text)

```

---

## Prompt Template for AI Story Generation
```

You are helping someone tell the story of their journey building Dream Builder,
a personal growth tool. You have access to 18 months of their daily logs,
voice notes, and photos.

USER CONTEXT:

- Journey started: May 28, 2023
- Current date: October 28, 2024
- Goal: Share this story on LinkedIn/Instagram by Oct 29, 7pm

DAILY LOGS (chronological):
[Insert all daily log data with dates]

MEDIA LIBRARY:
[Insert list of photos with dates]

TASK:
Create a compelling 3-5 minute video script that tells the story of this journey.

STRUCTURE:

1. Hook (0:00-0:15): Why this matters, the core question
2. Origin (0:15-0:45): What sparked this journey
3. Journey (0:45-2:30): The process, struggles, breakthroughs
4. Vision (2:30-3:15): What this is becoming, why it matters
5. Invitation (3:15-3:30): Call to action

REQUIREMENTS:

- Write in first person (this is their script to read)
- Be authentic and vulnerable, not polished marketing speak
- Reference specific moments from the logs (with dates)
- Suggest which photos to show at which timestamps
- Keep it real - mention the struggles, not just wins
- Make it inspirational but grounded

OUTPUT FORMAT:
Script text with [timestamp] markers and [SHOW: photo from date] suggestions

What Could Go Wrong & Contingencies
Risk 1: Backfilling 18 months takes forever
Mitigation:

Don't backfill every day, just key moments (aim for 20-30 significant days)
Can be rough notes, not polished
Focus on: spark moments, struggles, breakthroughs, wins

Risk 2: AI story generation isn't good enough
Mitigation:

Iterate on prompt 3-4 times
You can always edit heavily or write from scratch
AI is starting point, not final product

Risk 3: Build takes longer than expected
Mitigation:

Parts 1 & 2 are essential (must have)
Part 3 is bonus (if time is tight, YOU write the script manually using your backfilled logs as reference)
Having structured logs alone is valuable

Risk 4: You're too tired by morning
Mitigation:

Sleep at some point tonight
Wednesday morning you just need to record and edit
Can be scrappy - authentic beats perfect

My Recommendation
START NOW:

I'll write the database migration and backfill tool first (30 min)
You start thinking about which 20-30 days from your journey matter most
While you backfill, I build media upload
While you upload photos, I build story generator
By morning, you have everything you need to generate your story
