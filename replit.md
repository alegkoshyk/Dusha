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
- **Design**: Redesigned Dashboard matching mockups with brand cards, progress indicators, and consistent styling for action buttons. Implemented comprehensive admin navigation and card management with drag & drop reordering.

### Backend
- **Runtime**: Node.js with TypeScript and ES modules.
- **Framework**: Express.js for RESTful API endpoints.
- **Storage**: PostgreSQL database with Drizzle ORM.
- **Session Management**: Express sessions with PostgreSQL store for progress and response tracking.
- **Game Logic**: Three-level progressive structure (Soul → Mind → Body), card-based system with validation, real-time progress updates, and dynamic brand map generation from user responses. Includes a timer system with XP rewards and comprehensive authentication.

### Data Storage Solutions
- **Database**: PostgreSQL with a normalized schema managed by Drizzle ORM.
- **Schema**: Full relational database including tables for users, user profiles, brands, game levels, cards, card properties, relations, game sessions, and card responses.
- **Session Data**: Structured relational storage with foreign key constraints.

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