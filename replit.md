# Душа Бренду - Brand Transformation Game

## Overview
Душа Бренду (Soul of Brand) is a transformational game designed for entrepreneurs and marketers to discover and develop their brand identity. It guides users through an interactive, three-level journey: Soul (values, mission, story), Mind (strategy, positioning, audience), and Body (implementation, products, channels). Users answer questions and receive a comprehensive, exportable brand map (PDF). The project aims to provide an interactive tool for brand development, with features like progress tracking, session management, and a full administrative interface for managing game content and users.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript using Vite.
- **UI/UX**: shadcn/ui on Radix UI for accessibility, Tailwind CSS for styling with a neutral color palette, and custom CSS variables for theming.
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack Query for server state and optimistic updates.
- **Form Handling**: React Hook Form with Zod validation.
- **Design**: Redesigned Dashboard matching mockups with brand cards, progress indicators, and consistent styling for action buttons. Implemented comprehensive admin navigation and card management with drag & drop reordering. Added dark theme for all admin panels with improved readability. Created card option sets management system for predefined choices like brand archetypes.

### Backend
- **Runtime**: Node.js with TypeScript and ES modules.
- **Framework**: Express.js for RESTful API endpoints.
- **Storage**: PostgreSQL database with Drizzle ORM.
- **Session Management**: Express sessions with PostgreSQL store for progress and response tracking.
- **Game Logic**: Three-level progressive structure (Soul → Mind → Body), card-based system with validation, real-time progress updates, and dynamic brand map generation from user responses. Includes a timer system with XP rewards and comprehensive authentication.

### Data Storage Solutions
- **Database**: PostgreSQL with a normalized schema managed by Drizzle ORM.
- **Schema**: Full relational database including tables for users, user profiles, brands, game levels, cards, card properties, relations, game sessions, card responses, and new card option management system.
- **Card Option Sets**: New system for managing predefined choices (archetypes, values, channels) with configurable min/max selection rules.
- **Brand Chat Threads**: Tables for brand_chats (multi-thread per brand with name, context: agentId/productIds/audienceIds/gameSessionId) and brand_chat_messages (role, content, imageUrls). Full-screen layout with left sidebar listing all chats for the brand. Auto-names chat from first message. Context overrides passed per-message to AI. Chat settings (agent, products, audiences) persist to DB on every change and restore when switching chats. Sidebar shows context badges (purple=agent, amber=products, blue=audiences). Chat name editable via pencil icon on hover.
- **Target Audiences**: Tables for target_audiences and audience_segments with demographics, psychographics, behavioral data, and AI-generated portraits.
- **Session Data**: Structured relational storage with foreign key constraints.
- **Cloudflare R2**: S3-compatible object storage for ALL media assets. Service in `server/r2Storage.ts`, proxy endpoints at `/api/r2/*` (authenticated) and `/api/media/proxy` (backward compat).
  - `canvas/{brandId}/data.json` — canvas snapshots
  - `chat-images/{sessionId}/{timestamp}.ext` — generated images from AI chat
  - `logos/{brandId}/{uuid}.ext` — brand logos
  - `avatars/{userId}/{uuid}.ext` — user/persona avatars
  - `products/{productId}/{uuid}.ext` — product images
  - `templates/{templateId}/{uuid}.ext` — template reference images
  - `chat/{userId}/{uuid}.ext` — chat uploaded images
  - `merch/{brandId}/{uuid}.ext` — merch mockups
  - `attachments/{userId}/{uuid}.ext` — user attachments
  - DB stores R2 proxy URL (`/api/r2/{key}`) for all assets
  - Migration endpoint `POST /api/admin/migrate-media-urls` transfers existing GCS files to R2
  - Old `objectStorage.ts` (GCS) kept only for migration reading

### Target Audience Feature
- **Database Tables**: target_audiences (demographics, psychographics, behavior, AI portrait), audience_segments (sub-groups with personas)
- **AI Persona Generation**: OpenAI-powered generation of detailed audience personas based on brand data
- **API Endpoints**:
  - GET/POST `/api/brands/:brandId/target-audiences` - List/create audiences
  - GET/PATCH/DELETE `/api/target-audiences/:id` - Audience operations
  - GET/POST `/api/target-audiences/:audienceId/segments` - Segment operations
  - PATCH/DELETE `/api/audience-segments/:id` - Segment operations
  - POST `/api/brands/:brandId/generate-persona` - AI persona generation
- **Frontend**: Brand passport "Audience" tab, dedicated /target-audience/:brandId page with AI generation dialog

### Briefing System (Pro Tier)
- **Database Tables**: briefs (title, slug, hashed password, settings), brief_fields (type, label, options, sort order), brief_responses (respondent info, JSON answers)
- **Field Types**: short_text, long_text, multiple_choice (with custom option), dropdown
- **AI Generation**: OpenAI-powered brief structure generation from context
- **Public Access**: Shareable unique links via slug, accessible without authentication
- **Security**: bcrypt-hashed passwords, no password in API responses, slug collision prevention
- **API Endpoints**:
  - GET/POST `/api/briefs` - List/create briefs
  - GET/PATCH/DELETE `/api/briefs/:id` - Brief operations
  - GET `/api/brands/:brandId/briefs` - Brand-specific briefs
  - GET `/api/briefs/:id/responses` - View responses
  - POST `/api/briefs/generate` - AI brief generation
  - GET `/api/public/brief/:slug` - Public brief access
  - POST `/api/public/brief/:slug/verify` - Password verification
  - POST `/api/public/brief/:slug/submit` - Submit response
- **Frontend**: `/briefs/:brandId` page with builder, `/brief/:slug` public fill page

### AI Brand Name Generator
- **Database Tables**: brand_name_sessions (brief data, status), brand_name_results (name, scores, domain/social checks, trademark risk, linguistic analysis)
- **AI Generation**: Generates 15 brand name ideas with explanations, trademark risk analysis, linguistic scoring
- **Automated Checks**: DNS-based domain availability (.com, .ua, .io, .net, .store), HTTP-based social media handle checks (Instagram, Facebook, Telegram, TikTok)
- **Scoring**: Overall score (0-100) combining domain availability, social handles, trademark risk, linguistic quality
- **Admin Context**: Configurable AI context via `BRAND_NAME_GENERATOR_CONTEXT` app setting in admin panel
- **API Endpoints**:
  - POST `/api/name-generator/generate` - Generate names from brief
  - GET `/api/name-generator/sessions` - List user's generation history
  - GET `/api/name-generator/sessions/:id` - Get session with results
  - PATCH `/api/name-generator/results/:id/favorite` - Toggle favorite (with ownership check)
  - DELETE `/api/name-generator/sessions/:id` - Delete session
- **Frontend**: `/name-generator` page with brief form, results grid with scores, history sidebar
- **Dashboard**: Quick link tile "Назви / Генератор" on home page

### Export and Sharing
- **PDF Export**: jsPDF integration for branded PDF reports of the brand map.
- **Brand Map Visualization**: Dynamic preview of the completed brand strategy.
- **Progress Persistence**: Automatic saving of responses and session state.

## External Dependencies

### Core Framework & Build
- **React Ecosystem**: React 18, React DOM, Wouter.
- **TypeScript**: For type-safe development.
- **Build Tools**: Vite (client), ESBuild (server).

### UI and Styling
- **Component Library**: Radix UI.
- **Styling Framework**: Tailwind CSS, PostCSS.
- **Icons**: Lucide React.
- **Fonts**: Google Fonts (Inter, DM Sans, Fira Code, Geist Mono).

### Data Management & Validation
- **API Client**: TanStack Query.
- **Form Validation**: Zod.
- **Database ORM**: Drizzle ORM (PostgreSQL dialect).
- **Database Driver**: Neon Database serverless driver.

### Utilities & Infrastructure
- **Session Management**: Express session with connect-pg-simple.
- **PDF Generation**: jsPDF.
- **Date Handling**: date-fns.
- **Drag and Drop**: @dnd-kit.
- **Database**: PostgreSQL via Neon serverless.

### Authentication
- **Email/Password**: bcrypt hashing, session-based auth
- **Google OAuth**: Standard OAuth 2.0 flow
- **Apple OAuth**: JWT client secret with ES256 signature (DER to raw conversion)
- **Auth Tokens**: localStorage-based tokens for cross-device support

### Payment Integration
- **Provider**: Monobank Acquiring API (sandbox mode)
- **Currency**: UAH (kopiyky)
- **Flow**: User selects plan → Creates invoice → Redirects to Monobank → Webhook updates subscription
- **Endpoints**:
  - POST `/api/payments/create` - Create payment invoice
  - POST `/api/payments/webhook` - Monobank webhook handler
  - GET `/api/payments/:invoiceId/status` - Check payment status
  - GET `/api/admin/payments` - Admin transactions list
- **Configuration**: Requires MONOBANK_TOKEN secret
- **Webhook Security**: X-Sign header verification (development mode allows unsigned for sandbox testing)
- **Admin Panel**: Transactions page at /rcadmin/transactions shows all payment history

### Mobile App (Capacitor)
- **App ID**: site.brandsoul
- **App Name**: Душа Бренду
- **Platforms**: iOS (iPhone/iPad), Android
- **Payment Strategy**: 
  - iOS: Apple In-App Purchase (required by Apple)
  - Android/Web: Monobank
- **Platform Detection**: `client/src/lib/platform.ts` provides utilities for conditional logic
- **Build Process**:
  1. Run `npm run build` to create production build
  2. Run `npx cap sync` to sync web assets to native projects
  3. `npx cap open ios` - Open in Xcode (requires Mac)
  4. `npx cap open android` - Open in Android Studio
- **Requirements for Final Build**:
  - Mac with Xcode for iOS
  - Android Studio for Android
  - Apple Developer Account ($99/year) for App Store
  - Google Play Developer Account ($25 one-time)

### Quiz System
- **Database Table**: quiz_results (answers JSON, total_score, result_level)
- **Quizzes List**: `/quizzes/:brandId` - Hub page listing all available quizzes
- **Quiz Types**:
  1. "Де Я?" (`/quiz/:brandId`) - 10 questions, 5 categories, 4-option scoring
  2. "Готовність до Бренду з Душею" (`/quiz-soul/:brandId`) - 14 Tinder-style swipe questions, 4 result levels
  3. "Консистентність і проявлення" (`/quiz-consistency/:brandId`) - 16 swipe questions in 4 blocks (Clarity, Authenticity, Form, Manifestation)
- **Swipe Mechanics**: framer-motion drag with threshold detection (±100px), animated card exit
- **API Endpoints**:
  - GET `/api/brands/:brandId/quiz-results` - All quiz results for user+brand
  - GET `/api/brands/:brandId/quiz-results/latest` - Latest quiz result
  - POST `/api/brands/:brandId/quiz-results` - Save quiz result
- **Navigation**: "Квізи" button in brand edit page header → quizzes list → individual quiz

### Visual Canvas (tldraw)
- **Package**: tldraw v4.x (lazy-loaded to avoid React duplication)
- **Route**: `/canvas/:brandId` - Full-screen infinite canvas editor
- **License**: VITE_TLDRAW_LICENSE_KEY env var (client-side validated, safe to be public)
- **Architecture**: brand-canvas.tsx (wrapper with lazy Suspense) → brand-canvas-editor.tsx (tldraw component)
- **Navigation**: "Полотно" button in brand edit page header

## Documentation
Full project documentation available in `DOCUMENTATION.md`.