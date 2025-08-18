# Душа Бренду - Brand Transformation Game

## Overview

Душа Бренду (Soul of Brand) is a transformational game designed for entrepreneurs and marketers to discover and develop their brand identity through an interactive three-level journey. The application guides users through progressive stages of brand discovery: Soul (values, mission, story), Mind (strategy, positioning, audience), and Body (implementation, products, channels). Users answer thoughtfully designed questions and receive a comprehensive brand map as output, which can be exported as a PDF document.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom CSS variables for theming and a neutral color palette
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates
- **Form Handling**: React Hook Form with Zod validation for type-safe form handling

### Backend Architecture
- **Runtime**: Node.js with TypeScript and ES modules
- **Framework**: Express.js for RESTful API endpoints
- **Storage**: In-memory storage implementation with interface for future database integration
- **Session Management**: Game sessions with progress tracking and response storage
- **Development**: Hot module replacement with Vite integration in development mode

### Data Storage Solutions
- **Current**: PostgreSQL database with comprehensive normalized schema
- **Architecture**: Database-first approach with Drizzle ORM and relationship management
- **Schema**: Full relational database with tables for levels, cards, properties, relations, sessions, and responses
- **Session Data**: Structured relational storage with foreign key constraints and proper normalization
- **Migration**: Successfully migrated from in-memory to PostgreSQL with DatabaseStorage implementation

### Game Logic Architecture
- **Three-Level Structure**: Progressive unlocking from Soul → Mind → Body levels
- **Card-Based System**: Individual question cards with validation and response handling
- **Progress Tracking**: Real-time progress updates with level completion states
- **Response Management**: Structured storage of user responses with timestamps
- **Brand Map Generation**: Dynamic compilation of responses into cohesive brand strategy

### Export and Sharing Features
- **PDF Export**: jsPDF integration for generating branded PDF reports
- **Brand Map Visualization**: Dynamic preview of completed brand strategy
- **Progress Persistence**: Automatic saving of responses and session state

## Recent Changes (August 18, 2025)

### Authentication System Implementation
- Created complete PostgreSQL user management system with bcrypt password hashing
- Added users, user_profiles, user_settings, user_brands, and sessions tables
- Implemented full authentication API with login, register, logout endpoints
- Created session management with PostgreSQL store (connect-pg-simple)
- Added frontend authentication components (LoginForm, RegisterForm) with validation
- Integrated authentication into main App component with protected routes

### Multi-Brand Management System
- Created brand management interface with BrandSelector and CreateBrandDialog components
- Added brand CRUD operations with progress tracking
- Implemented game session creation linked to specific brands
- Added brandId column to game_sessions table with proper UUID foreign key
- Created test user: aleg@redcats.agency / Donttmenoww87

### Database Implementation
- Created comprehensive PostgreSQL schema with 6 main game tables
- Implemented DatabaseStorage class replacing in-memory storage
- Added game levels (Душа/Soul, Розум/Mind, Тіло/Body) with 15 total cards
- Populated database with game content: values, archetypes, communication channels
- Established card relationships for proper game progression logic
- Added API endpoints for levels, cards, and card properties

### Database Schema
- `users`: User accounts with authentication data
- `user_profiles`: Extended user profile information
- `user_settings`: User preferences and settings
- `user_brands`: Brand projects owned by users
- `sessions`: Express session storage
- `game_levels`: Game level definitions (Soul, Mind, Body)
- `game_cards`: Individual game cards with position, difficulty, and validation rules
- `card_properties`: Options for choice-based cards (values, archetypes, channels)
- `card_relations`: Progression relationships between cards
- `game_sessions`: User game sessions with brand linking and progress tracking
- `card_responses`: Individual responses to cards with timestamps

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, React Router (Wouter)
- **TypeScript**: Full TypeScript support with strict type checking
- **Build Tools**: Vite with React plugin and development optimizations

### UI and Styling
- **Component Library**: Radix UI primitives for accessible component foundations
- **Styling Framework**: Tailwind CSS with PostCSS for utility-first styling
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts integration (Inter, DM Sans, Fira Code, Geist Mono)

### Data Management
- **API Client**: TanStack Query for server state management and caching
- **Form Validation**: Zod for schema validation and type inference
- **Database ORM**: Drizzle ORM with PostgreSQL dialect (configured but not active)
- **Database Driver**: Neon Database serverless driver for PostgreSQL connection

### Development and Deployment
- **Development**: Replit-specific plugins for cartographer and runtime error handling
- **Session Management**: Express session with PostgreSQL store (connect-pg-simple)
- **PDF Generation**: jsPDF for client-side PDF export functionality
- **Date Handling**: date-fns for date formatting and manipulation

### Production Infrastructure
- **Database**: PostgreSQL with Neon serverless (configured via DATABASE_URL)
- **Build Process**: ESBuild for server bundling and Vite for client build
- **Environment**: Environment variable configuration for database connections