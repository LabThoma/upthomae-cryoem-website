# Screening Images Gallery Implementation Plan

## Overview
Display screening images in the view-only microscope details modal. Images are uploaded externally (command line/FTP) to a structured folder hierarchy. The gallery shows low/high magnification side-by-side with independent navigation and lightbox viewing.

## Folder Structure
```
private/screening_images/
└── {YYYYMMDD}/                    # Session date, e.g., 20260130
    └── {gridIdentifier}/          # e.g., AB123g1
        ├── low/                   # Low magnification images
        │   ├── 01_atlas.jpg
        │   └── 02_overview.png
        └── high/                  # High magnification images
            ├── 01_detail.jpg
            └── 02_feature.webp
```

- Supported formats: jpg, jpeg, png, webp
- Files sorted alphabetically (prefix with numbers for custom order)

## Implementation Steps

### Step 1: Create Image API Endpoint
**File:** `htdocs/php/endpoints/screening_images.php`

**Routes:**
- `GET /api/screening-images/{sessionDate}/{gridIdentifier}` - List images
  - Returns: `{ low: ["file1.jpg", "file2.png"], high: ["file1.jpg"] }`
- `GET /api/screening-images/{sessionDate}/{gridIdentifier}/{mag}/{filename}` - Serve image
  - Validates path (no directory traversal)
  - Checks MIME type
  - Sets cache headers

### Step 2: Add API Routing
**File:** `htdocs/php/api.php`

Register the new screening images endpoint routes.

### Step 3: Create Gallery Component
**File:** `htdocs/scripts/components/screeningImageGallery.js`

**Features:**
- Two independent image viewers (low mag left, high mag right)
- Each viewer has:
  - Square image container
  - Left/right arrow buttons
  - Image counter (e.g., "2/5")
- Click image to open lightbox overlay
- Lightbox shows larger image with close button
- "No screening images available" message when both folders empty

### Step 4: Update View Modal
**File:** `htdocs/scripts/components/microscopeGridDetailsModal.js`

- Replace placeholder at lines 249-256
- Pass session date (formatted as YYYYMMDD) and grid_identifier to gallery
- Fetch images when modal opens

### Step 5: Add CSS Styling
**File:** `htdocs/styles/components/_screening-gallery.css` (new)

- Gallery flex layout (two columns)
- Square image containers with `aspect-ratio: 1`
- Arrow button positioning
- Image counter styling
- Lightbox overlay (dimmed background, centered image, close button)

## UI Mockup
```
┌─────────────────────────────────────────────────┐
│ [Microscope Details, Quality Ratings, etc...]   │
├─────────────────────────────────────────────────┤
│                    Images                       │
│                                                 │
│   Low Magnification      High Magnification     │
│  ┌───────────────┐      ┌───────────────┐      │
│  │               │      │               │      │
│ ◀│     IMAGE     │▶    ◀│     IMAGE     │▶     │
│  │               │      │               │      │
│  └───────────────┘      └───────────────┘      │
│       1 / 3                   2 / 5            │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Progress Tracking

- [ ] Step 1: Create Image API Endpoint
- [ ] Step 2: Add API Routing
- [ ] Step 3: Create Gallery Component
- [ ] Step 4: Update View Modal
- [ ] Step 5: Add CSS Styling
- [ ] Testing with sample images

## Notes
- No database changes required (auto-scan approach)
- Grid identifier format: Initials + 3 digits + "g" + slot number (e.g., AB123g1)
- Low and high mag navigate independently (different image counts possible)
