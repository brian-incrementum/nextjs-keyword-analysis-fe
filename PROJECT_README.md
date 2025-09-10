# Keyword Analysis Tool - Frontend

A modern, responsive web application for analyzing keyword relevance and performance for products. Built with Next.js 15, React 19, TypeScript, and Tailwind CSS.

## Features

- **Dual Product Input Modes**
  - ASIN + Country code input
  - Product description text input
  
- **CSV Upload with Smart Detection**
  - Drag-and-drop file upload
  - Automatic keyword column detection
  - Preview and manual column selection
  
- **Real-time Analysis Progress**
  - Visual progress tracking
  - Estimated time remaining
  - Multi-stage process indicators
  
- **Interactive Results Table**
  - Sortable and filterable columns
  - Search functionality
  - Pagination
  - Export to CSV or Excel

## Tech Stack

- **Framework:** Next.js 15.5.2 with Turbopack
- **UI Library:** React 19.1.0
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** shadcn/ui + Radix UI
- **Table:** TanStack Table
- **Forms:** React Hook Form + Zod validation
- **File Handling:** React Dropzone + PapaParse
- **Notifications:** Sonner

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd nextjs-keyword-analysis-fe
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

## Usage

1. **Navigate to the Tool**
   - Visit the home page and click "Get Started"
   - Or go directly to `/keyword-analysis`

2. **Enter Product Information**
   - Choose between ASIN mode or Description mode
   - For ASIN: Enter 10-character ASIN and select country
   - For Description: Enter detailed product description

3. **Upload Keywords CSV**
   - Drag and drop or click to upload a CSV file
   - The tool will auto-detect the keyword column
   - Verify or manually select the correct column
   - Preview shows first 5 keywords

4. **Analysis Process**
   - Analysis starts automatically after upload
   - Takes 30-60 seconds to complete
   - Progress bar shows current status
   - Can cancel at any time

5. **Review and Export Results**
   - Sort and filter results
   - Search for specific keywords
   - Export to CSV or Excel format

## API Integration

The frontend expects a POST endpoint at `/api/analyze` that accepts:

### Request with ASIN:
```json
{
  "asin": "B08N5WRWNW",
  "country": "US",
  "keywords": ["keyword1", "keyword2", ...]
}
```

### Request with Description:
```json
{
  "product_description": "Product description text...",
  "keywords": ["keyword1", "keyword2", ...]
}
```

### Expected Response:
```json
{
  "keywords": [
    {
      "keyword": "example keyword",
      "relevance": 85,
      "searchVolume": 5000,
      "competition": "medium",
      "suggestedBid": 2.50,
      "analysis": "Analysis text..."
    }
  ],
  "processingTime": 45000,
  "requestId": "uuid"
}
```

## Mock Data

When the API is not available, the app will use mock data for demonstration purposes. This allows testing the UI without a backend connection.

## Project Structure

```
├── app/
│   ├── keyword-analysis/     # Main analysis page
│   ├── layout.tsx            # Root layout with Toaster
│   └── page.tsx              # Landing page
├── components/
│   ├── keyword-analysis/     # Feature components
│   │   ├── product-input.tsx
│   │   ├── csv-upload.tsx
│   │   ├── analysis-process.tsx
│   │   └── results-table.tsx
│   └── ui/                   # shadcn/ui components
├── lib/
│   └── utils/
│       ├── api-client.ts     # API integration
│       ├── csv-export.ts     # Export utilities
│       └── utils.ts          # General utilities
└── types/
    └── keyword-analysis.ts   # TypeScript definitions
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Private project - All rights reserved