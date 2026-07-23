# Ashiato (足跡)

A Polarsteps-style travel journal for Japan: a rotating 3D globe, trips plotted
on a Mapbox map of Japan, photo pins per location, transport-aware routes, and a
47-prefecture digital goshuin (shrine stamp) collection.

Expo (React Native) + Supabase. Runs on iOS / Android / Web. The UI is in English.

## Design language — "Sumi & Shu"

Washi paper ground, indigo (ai) as the structural colour, vermilion (shu) as the
accent. No heavy boxes — space, hairline rules and a Mincho display face.
Light / dark aware (`lib/theme.ts`, `lib/useTheme.ts`).

## The map experience

- **Home (`app/(tabs)/map.tsx`)** — a rotating Mapbox globe at the top with a pin
  on each trip, and the trip list below.
- **Trip (`app/trip/[id]/index.tsx`)** — a Mapbox map of Japan. Each saved
  location becomes a photo pin (the first of up to 10 photos). A horizontal card
  carousel sits over the map; sliding the cards flies the map to the active
  location (`easeTo`), and tapping a pin scrolls to its card. Legs between
  locations are drawn per transport mode: car/walk use the Mapbox Directions API;
  flight/shinkansen/train/ferry are drawn as arcs.

Web uses `mapbox-gl` (loaded from CDN in `lib/mapbox.ts`). Native uses a
placeholder for now — swap in `@rnmapbox/maps` for a native build.
`components/map/*.web.tsx` and `*.native.tsx` are resolved per platform by Metro.

## Setup

```bash
npm install
npm run web      # browser
npm start        # Expo Go on a device
```

Environment (`.env`, all optional — the app runs on mock data without them):

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_MAPBOX_TOKEN=      # public pk. token; restrict it by URL in Mapbox
```

## Screens

| Area | Route |
|------|-------|
| Login | `app/(auth)/login.tsx` |
| Onboarding | `app/(auth)/onboarding.tsx` |
| Home (globe + trips) | `app/(tabs)/map.tsx` |
| Goshuin collection | `app/(tabs)/goshuin.tsx` |
| Explore | `app/(tabs)/explore.tsx` |
| Profile | `app/(tabs)/profile.tsx` |
| Trip (map + cards) | `app/trip/[id]/index.tsx` |
| New trip | `app/trip/new.tsx` |
| Add / edit stop | `app/trip/[id]/step/*` |
| Goshuin detail | `app/goshuin/[id].tsx` |
| Share | `app/share.tsx` |
| Gallery | `app/gallery.tsx` |

### Shells only (engines not built yet)

Route card create/preview (`app/ugc/*`) and photo book (`app/book/new.tsx`):
UI is present; Skia rendering, PDF export and checkout are planned.

Admin (web) screens are out of scope for now.

## Deploy (Vercel)

`vercel.json` sets `buildCommand: npx expo export -p web`, `outputDirectory: dist`,
and an SPA rewrite so deep links resolve.

## Data model

See `supabase/migrations/`. Location tracking is manual check-in (no background
GPS); choosing a prefecture on a stop stamps its goshuin.
