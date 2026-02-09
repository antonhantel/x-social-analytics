# GI Social Analytics

A dashboard for tracking Twitter/X engagement from AI researchers and industry thought leaders. Monitor who's following you, track likes/reposts/replies, and identify your most engaged connections.

## Features

- **Target List Management**: Upload CSV of researchers to track, or add manually
- **Follower Tracking**: Upload your follower list to see which targets follow you
- **Notification Processing**: Import Twitter/X notification exports to track likes, reposts, and replies
- **Deduplication**: Automatically skips duplicate notifications across uploads
- **Engagement Levels**: Three-tier status system (Target → Engaged → Hot)
- **KPI Dashboard**: Track targets reached, heavily engaged %, and relevant followership
- **Sortable Table**: Sort by handle, following status, likes, interactions, or engagement level
- **Cloud Persistence**: Optional Supabase integration for cross-device sync

## Quick Start

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

## Environment Variables

For cloud persistence, create a `.env` file:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Without these, data is stored in localStorage (browser-only).

## CSV Formats

### Target Researchers
```
handle,name
ylecun,Yann LeCun
https://x.com/AndrewYNg,Andrew Ng
```

### Follower List
```
handle
ylecun
demis_hassabis
```

### Notifications (Twitter/X export)
The tool auto-detects likes, reposts, and replies from the standard Twitter/X notification export format.

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase (optional)

## Deployment

Deploy to Vercel:

```sh
npm run build
vercel deploy
```

Set environment variables in Vercel project settings for cloud persistence.
