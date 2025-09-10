# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start the development server with Turbopack at http://localhost:3000
- `npm run build` - Build the production application with Turbopack
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

### Dependencies
- `npm install` - Install all dependencies

## Architecture

This is a Next.js 15.5.2 application using:
- React 19.1.0 with App Router
- TypeScript with strict mode enabled
- Tailwind CSS v4 for styling
- Tailwind CSS utilities library with `cn()` helper in `lib/utils.ts`
- shadcn/ui component system configured (components.json present)
- Lucide React for icons

### Key Directories
- `app/` - Next.js App Router pages and layouts
- `lib/` - Utility functions including `cn()` for className merging
- `components/` - React components (to be created as needed)
- `public/` - Static assets

### Configuration
- TypeScript path alias: `@/*` maps to the project root
- ESLint configured with Next.js rules
- Turbopack enabled for faster builds