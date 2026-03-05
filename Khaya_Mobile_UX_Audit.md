# Khaya — Mobile UX Audit & Enhanced Experience Map

**Date:** 5 March 2026
**Platform:** localhost:5050 — Chrome (430×932 mobile viewport)
**Version:** 1.0.0-mvp

---

## Live Test Results

### Search Tab — PASS
- Dark Leaflet map renders with CartoDB dark tiles
- Flame Orange (featured) and Teal (standard) map pins display correctly
- Search input with placeholder and clear button works
- Price filters (< R1M, R1M–R3M, R3M–R5M, R5M+) toggle correctly
- Bedroom filters (2+, 3+, 4+) work and combine with price filters
- Filter combination: R5M+ AND 2+ Beds correctly reduced 12 → 5 results
- Bottom sheet with drag handle shows property count and "View all" toggle
- Property list cards with thumbnails, prices in ZAR format (R3 250 000), beds/bath/m² chips

### Explore Tab — PASS
- 2-column grid layout with property cards
- Featured badges render on qualifying listings
- Teal proximity banner: "6 homes for sale near you right now"
- Compass button toggles Explore Mode active state with pulsing animation
- "From R1 850 000 · Sandton, Johannesburg" context line

### Snap-a-Home Tab — PASS
- Ready state: camera icon, description, large shutter button
- Camera viewfinder: Flame Orange corner brackets, crosshair overlay, shutter + close buttons
- Analysing state: pulsing radar animation with loading text
- Result (listing found): green success banner, property card, "View Full Details" CTA
- Result (no listing): amber alert, investigation reference (INV-XXXXX), WhatsApp follow-up note

### Chats Tab — PASS
- Message list with 3 conversations
- Unread badges (Flame Orange circles with count)
- Property title and last message preview with date
- Conversation view: WhatsApp-style bubbles (Flame Orange = user, dark = agent)
- Timestamps, "Online" status indicator, message input with send button

### Profile Tab — PASS
- User avatar with Flame Orange border, name "Cornel", email "cornel@tideshift.co.za"
- Stats row: 24 Viewed (Flame), 5 Agents (Teal), 3 Saved (Green)
- Saved Properties list with heart icons
- Settings: Dark Mode toggle (functional), Proximity Alerts, Language, Version

### Listing Detail Overlay — PASS
- Slide-up animation from bottom
- Hero image with carousel (dots + left/right arrows)
- Back button (‹) and save/heart toggle
- Price overlay with full address
- WhatsApp Agent (Flame) + Navigate (Teal) CTA buttons
- Property info chips: Beds, Baths, Floor m², Erf m²
- Feature tags: Cluster, Pool, Security estate, Pet friendly, Fibre ready
- Description with "Read more" expand
- AI Valuation Estimate: asking vs estimate with gradient progress bar and confidence %
- Agent card: photo, name, agency, verified badge, star rating, review count, response time, EAAB FFC number, "Chat with [name]" CTA

---

## Enhanced Mobile UX Recommendations

### 1. ONBOARDING & FIRST-TIME EXPERIENCE

**Current:** Splash screen → dumps directly into Search map.

**Enhanced:**
- Add a 3-screen swipeable onboarding after splash (only on first visit):
  - Screen 1: "Search your way" — map preview with filter pills
  - Screen 2: "Snap any home" — camera viewfinder illustration
  - Screen 3: "Chat with agents instantly" — WhatsApp chat preview
- Add a location permission prompt with SA-friendly copy: "Allow Khaya to find properties near you?"
- Store onboarding completion in state so it only shows once

### 2. SEARCH TAB — MAP EXPERIENCE

**Current:** Static zoom level 10, Gauteng-centered. All 12 pins visible.

**Enhanced:**
- **Cluster markers** — when pins overlap (e.g., the Sandton cluster), show a count circle "4" that expands on tap
- **"Search this area" button** — appears when user pans/zooms the map, triggers reload for that region
- **My location button** — blue dot with pulse, repositions map to user's GPS
- **Map pin tap → mini card** — currently shows a Leaflet popup; replace with a floating card that slides up from bottom with swipe-to-dismiss, matching the app's design language
- **Recent searches** — dropdown beneath search input showing "Bryanston", "Camps Bay", etc.
- **Sort options in bottom sheet** — "Price: Low→High", "Newest", "Nearest" pills above the property list
- **Skeleton loading cards** — use the existing shimmer animation while images load

### 3. EXPLORE TAB — PROXIMITY MODE

**Current:** Static list of 6 nearby properties. Compass button toggles an alert banner.

**Enhanced:**
- **Real GPS integration** — use the Geolocation API to actually calculate distance from each property
- **Distance badges** — "1.2 km away" on each card
- **"Drive mode" banner** — when Explore Mode is active and speed > 20km/h, show a simplified card that auto-refreshes every 30 seconds
- **Push notification simulation** — toast notification slides in from top: "New listing 400m from you — R3.2M, 3 bed"
- **Neighborhood context cards** — "Bryanston: avg R3.5M, 12 schools, 4 min to Gautrain" between property cards
- **Horizontal scroll "Just Listed"** row at top for the newest 3 properties

### 4. SNAP-A-HOME — CAMERA EXPERIENCE

**Current:** Simulated viewfinder with random result (70% found / 30% not found).

**Enhanced:**
- **Real camera feed** — use `navigator.mediaDevices.getUserMedia()` for live video background in the viewfinder
- **GPS tag overlay** — show current coordinates and suburb name at top of viewfinder
- **Gallery upload option** — "Upload from gallery" button below the shutter for photos already taken
- **Analysis progress steps** — replace single "Analysing..." with a stepped progress:
  1. "Capturing image..." (0.5s)
  2. "Detecting property..." (1s)
  3. "Cross-referencing GPS..." (0.5s)
  4. "Searching database..." (0.5s)
- **Confidence indicator on results** — "92% match" badge on the found listing
- **Share result** — "Share this listing" button when a match is found

### 5. CHATS — MESSAGING EXPERIENCE

**Current:** 3 static conversations. Tapping into a chat shows 5 hardcoded messages.

**Enhanced:**
- **Typing indicator** — animated "..." dots when agent is "typing"
- **Read receipts** — double blue ticks on sent messages
- **Property context header** — show the property thumbnail + price in the chat header bar, tappable to view listing
- **Quick reply suggestions** — pill buttons below the input: "When can I view?", "Is the price negotiable?", "Send me more photos"
- **Voice note button** — microphone icon that toggles with send button (like WhatsApp)
- **Image sharing** — camera icon for sending photos to agent
- **"Schedule a Viewing" action card** — inline card with date picker: "Pick a time to view this property"
- **Chat search** — magnifying glass in header to search message history
- **Unread count on tab icon** — badge on the Chats tab showing total unread (currently already works)

### 6. PROFILE — PERSONALIZATION

**Current:** Static stats, 3 saved properties, settings with dark mode toggle.

**Enhanced:**
- **Profile photo upload** — tap the avatar to change photo from camera/gallery
- **Property alerts setup** — "Get notified when new 3-bed homes under R4M list in Bryanston"
- **Search history timeline** — "You viewed 5 properties this week" with a mini chart
- **Saved searches** — "Sandton 3-bed under R5M" as a tappable saved filter
- **Document vault** — "Your Documents" section for offer letters, pre-approvals, bond documents
- **Bond calculator** — quick tool: enter price, deposit %, interest rate → monthly repayment
- **Referral program card** — "Invite friends, earn R500 per sign-up"
- **Logout button** at bottom
- **Dark/Light mode** — actually toggle the UI theme (currently the toggle animates but doesn't change colors)

### 7. LISTING DETAIL — PURCHASE JOURNEY

**Current:** Good detail view with AI valuation. Two CTAs: WhatsApp + Navigate.

**Enhanced:**
- **Image counter** — "1/3" badge on hero image
- **Pinch-to-zoom on images** — fullscreen image gallery on tap
- **Share button** — alongside the heart/save button, share via WhatsApp/copy link
- **"Similar properties" carousel** — horizontal scroll at bottom showing 3-4 similar listings by price/area
- **Neighborhood insights section:**
  - Walk score (e.g., 72/100)
  - Schools within 5km (with ratings)
  - Crime stats (SAPS data)
  - Load shedding zone
  - Fibre availability (Rain, Vumatel, Openserve)
- **Virtual tour button** — "Take a 360° tour" CTA (placeholder for future)
- **Offer to Purchase flow** — "Make an Offer" button that opens a form: offer price, conditions, bond pre-approval status
- **Bond affordability check** — inline widget: "Can you afford this? Enter your monthly income"
- **Price history graph** — if property was listed before, show price changes over time
- **Agent availability calendar** — show available viewing slots directly in the listing

### 8. BOTTOM NAVIGATION — INTERACTION POLISH

**Current:** 5-tab bar with elevated center Snap button.

**Enhanced:**
- **Haptic feedback simulation** — CSS scale animation on tab press (already has active:scale-95)
- **Tab transition animations** — crossfade between tabs instead of instant swap
- **Snap button glow** — subtle pulsing glow on the center camera button to draw attention
- **Long press on Search tab** — opens recent searches
- **Badge count on Chats** — show total unread messages as a red dot (partially done)
- **Swipe between tabs** — horizontal swipe gesture to move between adjacent tabs

### 9. PERFORMANCE & MICRO-INTERACTIONS

- **Image lazy loading** — already using loading="lazy", but add blur-up placeholder (tiny base64 thumbnail → full image)
- **Pull-to-refresh** — on Explore and Chats tabs
- **Offline state** — "You're offline. Showing cached listings." banner
- **Error states** — empty states with illustrations: "No properties match your filters" with a reset button
- **Toast notifications** — non-blocking feedback: "Property saved!", "Filter applied"
- **Skeleton screens** — replace blank states with shimmer loading patterns while data loads
- **Smooth scroll snap** — on image carousels, use CSS scroll-snap for native-feeling swipe

### 10. SA-SPECIFIC FEATURES (FUTURE)

- **Load shedding schedule** — "This area is Stage 4, Group 2. Next outage: 16:00-18:30"
- **Title deed verification** — "Verify this property on the Deeds Office"
- **FICA document upload** — for offer-to-purchase compliance
- **Home affairs integration** — ID verification for buyer/seller matching
- **Transfer cost calculator** — attorney fees, transfer duty, bond registration
- **Rental yield calculator** — for investment properties, show potential rental income vs bond repayment

---

## Priority Implementation Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Real GPS + distance badges | Medium | High |
| P0 | Image pinch-to-zoom gallery | Low | High |
| P0 | Share listing (WhatsApp/link) | Low | High |
| P1 | Cluster markers on map | Medium | High |
| P1 | Quick reply suggestions in chat | Low | Medium |
| P1 | Bond calculator in Profile | Medium | High |
| P1 | Similar properties carousel | Medium | High |
| P1 | Real camera feed for Snap | Medium | High |
| P2 | Onboarding screens | Low | Medium |
| P2 | Neighborhood insights | High | High |
| P2 | Offer-to-Purchase flow | High | High |
| P2 | Tab swipe gestures | Medium | Medium |
| P3 | Load shedding integration | Medium | Medium |
| P3 | Transfer cost calculator | Low | Medium |
| P3 | Document vault | High | Medium |

---

*Generated from live testing on Khaya v1.0.0-mvp — Cornel Schoeman, TideShift*
