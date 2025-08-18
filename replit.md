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
- **Current**: In-memory storage using Maps for game sessions and responses
- **Future-Ready**: Database abstraction layer with IStorage interface for easy migration to PostgreSQL
- **Schema**: Drizzle ORM configured for PostgreSQL with defined table schemas
- **Session Data**: JSON storage for flexible response data and progress tracking

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