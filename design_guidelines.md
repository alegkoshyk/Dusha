# Brand Transformation Game App - Design Guidelines

## Design Approach

**Reference-Based:** Drawing from Duolingo's gamification mastery, Notion's card elegance, Linear's professional polish, and Headspace's spiritual-meets-modern aesthetic. This creates an engaging yet professional game experience that balances playfulness with credibility.

## Typography System

**Font Families:**
- Primary: Inter (UI elements, body text, cards)
- Display: Space Grotesk (headings, level titles, dashboard)

**Hierarchy:**
- H1 (Dashboard title): 3xl/4xl, bold, tracking-tight
- H2 (Level names): 2xl/3xl, semibold
- H3 (Card titles): xl, semibold
- Body: base/lg, normal weight
- Meta text: sm/xs, medium weight

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 24 for consistent rhythm.

**Grid Structure:**
- Dashboard cards: 2-column on tablet (md:grid-cols-2), 3-column on desktop (lg:grid-cols-3)
- Level sections: Full-width with contained content (max-w-7xl)
- Brand map: Full viewport area with padding constraints

## Core Components

### Dashboard Layout
**Hero Section (80vh):**
- Left-aligned content with large hero image on right (40/60 split on desktop)
- User greeting headline + progress stats (cards completed, current level)
- Primary CTA button with blurred background overlay positioned on hero image
- Gradient overlay on image (purple-to-transparent) for visual depth

**Brand Cards Grid:**
- Card design: Rounded corners (rounded-xl), elevated shadow (shadow-lg), 16:9 aspect ratio header image
- Card structure: Image header + title + progress indicator + difficulty badge
- Hover state: Subtle scale transform (scale-105) with increased shadow
- Level indicator: Small badge in top-right corner showing Soul/Mind/Body with respective accent
- Completion checkmark: Prominent circular checkmark overlay for completed cards

### Game Levels Section
**Three-Column Level Cards (Soul/Mind/Body):**
- Each level card spans full-bleed with gradient background treatment
- Icon representation (abstract symbols for Soul/Mind/Body)
- Progress circle showing completion percentage (stroke-based circular progress)
- Card count and estimated time remaining
- "Continue" or "Start" button based on progress state

### Brand Map Visualization
**Interactive Map Layout:**
- Node-based tree structure flowing top-to-bottom
- Connection lines between completed cards (organic curves, not straight lines)
- Card nodes: Circular avatars with card preview imagery
- Active/completed states: Full opacity with glow effect
- Locked states: Reduced opacity (40%) with lock icon overlay
- Current position: Pulsing highlight ring around active card
- Zoom/pan controls in bottom-right corner

### Modal Design
**Card Detail Modal:**
- Full-screen overlay with backdrop blur effect
- Content container: max-w-4xl, centered, with generous padding (p-12)
- Close button: Top-right, large tap target (h-12 w-12)
- Structure: Hero image (16:9) + title + level badge + description sections + action buttons
- Response history: Timeline-style list showing previous completions if applicable
- Primary "Begin Exercise" button at bottom

## Navigation

**Sidebar (Desktop) / Bottom Tab Bar (Mobile):**
- Icons + labels: Dashboard, Levels, Map, Profile, Settings
- Active state: Accent color background with increased icon scale
- Sidebar width: 280px with collapsible option to icon-only 80px

## Animations & Interactions

**Minimal Strategic Use:**
- Card hover: Smooth scale transition (300ms ease-out)
- Modal enter/exit: Fade + scale animation
- Progress updates: Number counter animation when values change
- Map node unlock: Brief celebration animation (scale pulse + sparkle effect)

**NO animations for:** Standard button states, scrolling effects, page transitions

## Images

### Hero Section Image
Large, professional image on dashboard showing diverse entrepreneurs in modern workspace or abstract brand/identity visualization. Position: Right 60% of hero section (desktop), full-width background (mobile). Style: Modern, inspiring, slightly desaturated to support overlay text.

### Card Header Images
Each brand card needs distinct imagery representing the exercise theme - abstract patterns, symbolic photography, or illustration. Aspect ratio: 16:9. Treatment: Subtle gradient overlay at bottom for title legibility.

### Level Section Imagery
Abstract symbolic icons/illustrations for Soul (spiritual), Mind (cognitive), Body (physical) concepts. Style: Minimalist, line-based or geometric, matching the sophisticated professional tone.

## Responsive Behavior

**Breakpoints:**
- Mobile: Single column, bottom navigation, stacked hero content
- Tablet (768px): Two-column cards, sidebar remains bottom bar
- Desktop (1024px): Three-column cards, permanent sidebar, hero split layout

**Map Visualization:** Touch gestures for mobile (pinch-zoom, pan), mouse controls for desktop (scroll-zoom, drag)

## Ukrainian Localization Considerations

Ensure adequate spacing for Cyrillic characters (typically 15-20% wider than Latin). Test all UI labels with Ukrainian text to prevent overflow. Right-align numbers and dates per Ukrainian conventions.