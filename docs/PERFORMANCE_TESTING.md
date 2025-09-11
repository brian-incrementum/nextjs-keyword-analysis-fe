# Performance Testing Guide

## Test Data Available

Test CSV files have been generated in `public/test-data/`:

- `test-keywords-100.csv` - 100 keywords (baseline test)
- `test-keywords-1000.csv` - 1,000 keywords (small batch)
- `test-keywords-5000.csv` - 5,000 keywords (medium batch)
- `test-keywords-10000.csv` - 10,000 keywords (large batch)
- `test-keywords-20000.csv` - 20,000 keywords (stress test)

## How to Test

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/keyword-analysis

3. Complete the product information step (use ASIN or description)

4. Upload one of the test CSV files

5. Monitor performance using Chrome DevTools:
   - Open DevTools (F12)
   - Go to Performance tab
   - Start recording before upload
   - Stop after results display

## Performance Targets

Based on the optimization plan, the following targets should be met:

| Dataset Size | UI Freeze | First Result | Memory Usage | FPS |
|-------------|-----------|--------------|--------------|-----|
| 1,000 keywords | <50ms | <1s | <50MB | 60 |
| 5,000 keywords | <50ms | <2s | <100MB | 60 |
| 10,000 keywords | <50ms | <3s | <150MB | 60 |
| 20,000 keywords | <50ms | <5s | <200MB | 60 |

## Key Improvements Implemented

### 1. Web Worker Processing
- Keyword grouping happens off the main thread
- O(n) algorithm with Map-based caching
- Progress updates throttled to 100ms intervals

### 2. Virtual Scrolling
- Uses react-virtuoso for efficient rendering
- Only visible rows are rendered
- Supports both flat and grouped views

### 3. Optimized Algorithm
- Changed from O(n²) to O(n) complexity
- Map-based normalization cache
- Single-pass grouping

### 4. Debounced Filtering
- 200ms debounce on search input
- Prevents UI stuttering during typing

## Testing Checklist

- [ ] UI remains responsive during processing
- [ ] Smooth scrolling at 60 FPS
- [ ] Cancel button works immediately
- [ ] Filter/sort operations are smooth
- [ ] Memory usage stays within targets
- [ ] No long tasks (>50ms) on main thread
- [ ] Progress updates show realistic estimates
- [ ] Export functionality works with large datasets

## Generating More Test Data

To generate custom test data, run:

```bash
node scripts/generate-test-data.js
```

Modify the script to generate different sizes or keyword patterns as needed.