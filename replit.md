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

## Recent Changes (August 21, 2025)

### Complete Material UI Migration
- Successfully migrated entire project from shadcn/ui to Material UI for improved design consistency
- Created comprehensive Material UI theme with Ukrainian brand colors and typography
- Implemented ThemeProvider with light/dark mode support and localStorage persistence
- Built Material UI versions of all major components:
  * MuiDashboard - Complete dashboard with statistics cards, brand management, and tabbed interface
  * MuiHeader - Navigation header with user menu, theme toggle, and responsive design
  * MuiMobileGame - Mobile game interface with level navigation and card progress tracking
  * MuiBrandBoard - Brand board with PDF export and comprehensive data visualization
- Resolved all Grid layout issues and property mapping for GameCard schema
- Updated routing to use Material UI components as primary interface
- Maintained all existing functionality while improving visual consistency and user experience

## Recent Changes (August 20, 2025)

### Authentication System Complete Fix
- Fixed all authentication issues - logout, login, and registration working with proper JSON responses
- Updated UserDropdown to use useAuth hook correctly for logout functionality
- Fixed schema validation requiring confirmPassword field for registration
- Authentication API endpoints now return proper JSON responses instead of redirects
- Test user credentials confirmed working: aleg@redcats.agency / Donttmenoww87

### GameCard Component Enhancement for All Card Types
- Added complete support for "archetype" card type in GameCard component
- Fixed soul-archetype card display by adding proper archetype selection UI with radio buttons
- Updated validation logic to include archetype cards alongside choice and values cards
- All card types now properly render content and allow response selection:
  * archetype: Radio button selection with database properties
  * choice: Single selection options
  * values: Multiple selection checkboxes
  * text/reflection: Text input areas
  * audience: Specialized input for target audience

### Card Response System Testing and Validation
- Successfully tested card response saving for all card types
- Fixed mind-audience card type from 'audience' to 'text' in database
- Verified API endpoints properly save responses for:
  * soul-archetype (archetype selection): ✓ Working
  * mind-audience, mind-target (text input): ✓ Working  
  * body-pricing (choice selection): ✓ Working
  * body-channels (choice selection): ✓ Working
  * body-metrics (values multiple selection): ✓ Working
- All cards now save responses correctly with proper progress tracking

## Recent Changes (August 19, 2025)

### Game Completion and Brand Board Features
- Created comprehensive Brand Board page displaying all game responses organized by levels
- Added auto-completion logic: games are automatically marked as completed when accessing Brand Board
- Implemented detailed card mapping showing all responses with card titles and proper formatting
- Added visual indicators for completion status in dashboard
- Created body-complete card with congratulations UI and navigation options
- Fixed API endpoints for retrieving all card responses with proper database joins

### Card Response System Fixes
- Fixed critical bug where card responses were not saving due to missing database entries
- Added missing game cards to database: mind-solution, mind-benefit, mind-problem, body-pricing, body-tone, body-metrics, body-launch
- Fixed type mismatch for mind-audience card (changed from 'audience' to 'text' type)
- Improved validation logic to allow empty responses as drafts
- Added comprehensive logging for debugging card saving issues
- Successfully tested card response saving with API - returning 200 status

### Input Field Implementation for Target Audience
- Added specialized Input component for target audience cards (mind-audience, mind-target)
- Fixed display conditions to show input fields for all text/reflection cards
- Updated button logic to properly handle different card types
- Fixed exclusion logic for intro cards (soul-start, mind-start, body-start)
- Simplified button text and validation for better user experience

### Dashboard and Navigation Improvements
- Added Header component with persistent navigation for authenticated users
- Redesigned Dashboard to match provided design mockup with brand cards
- Changed default route "/" to Dashboard instead of Home for better UX
- Added "Create New Brand" card with dashed border styling
- Implemented brand cards with progress indicators and status badges (Active/Completed)
- Styled action buttons: "Continue" (blue fill) and "New Game" (blue outline) matching design
- Added clickable brand cards that navigate directly to game sessions
- Fixed React import issues in Dashboard component

### Mobile Game Route Fixes
- Added /mobile-game route to App.tsx for direct access
- Fixed sessionId handling to work with or without URL parameters
- Updated all API calls to use activeSessionId instead of sessionId
- Improved error handling for missing sessions

## Previous Changes (August 18, 2025)

### UI/UX Improvements
- Added UserDropdown component with logout and dashboard navigation
- Removed progress bars from individual game cards for cleaner interface
- Modified "Про Гру" card to be purely informational without interactive elements
- Restored overall progress bar with triple gradient (purple-blue-green) and card count display
- Enhanced level selection tabs with progress bars and percentage indicators
- Removed redundant "soul-intro" card to streamline game flow

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

### Database Implementation & Bug Fixes
- Created comprehensive PostgreSQL schema with 6 main game tables
- Implemented DatabaseStorage class replacing in-memory storage
- Added missing game cards: soul-impact, soul-archetype, mind-target to database
- Fixed card response saving failures by ensuring all referenced cards exist
- Populated database with archetype options and card properties
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