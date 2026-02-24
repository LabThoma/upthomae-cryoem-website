#!/usr/bin/env bash
# upload_screening_images.sh
#
# Upload screening images from the cluster to the website.
#
# FOLDER MODE — source folder must contain low/ and/or high/ subfolders:
#   ./upload_screening_images.sh [--skip-existing] <session_date> <grid_identifier> <source_folder>
#
# DIRECT MODE — upload a flat folder of images or a single image, with explicit mag:
#   ./upload_screening_images.sh [--skip-existing] --mag <low|high> <session_date> <grid_identifier> <source>
#
# Examples:
#   # Folder mode
#   ./upload_screening_images.sh 20260223 AB123g1 /scratch/screening/20260223/AB123g1
#
#   # Direct mode — flat folder
#   ./upload_screening_images.sh --mag low 20260223 AB123g1 /scratch/screening/my_low_images/
#
#   # Direct mode — single file
#   ./upload_screening_images.sh --mag high 20260223 AB123g1 /scratch/screening/image.jpg
#
# Options:
#   --skip-existing   Skip files already on the server (checked via GET list endpoint)
#   --mag <low|high>  Switch to direct mode; required when source is a file or flat folder
#
# Prerequisites:
#   - Set CRYOEM_UPLOAD_KEY in your ~/.bashrc:
#       export CRYOEM_UPLOAD_KEY="your-secret-key-here"
#   - Set CRYOEM_UPLOAD_URL in your ~/.bashrc:
#       export CRYOEM_UPLOAD_URL="https://yoursite.com/api/screening-images/upload"

set -euo pipefail

# ── Configuration ──────────────────────────────────────────────────────────────
UPLOAD_URL="${CRYOEM_UPLOAD_URL:-}"
API_KEY="${CRYOEM_UPLOAD_KEY:-}"
ALLOWED_EXTENSIONS="jpg jpeg png webp"
RETRY_COUNT=3
SKIP_EXISTING=false
MAG=""  # empty = folder mode; "low"/"high" = direct mode

# ── Parse flags ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "${1:-}" in
        --skip-existing)
            SKIP_EXISTING=true
            shift
            ;;
        --mag)
            if [[ -z "${2:-}" ]]; then
                echo "Error: --mag requires a value (low or high)"
                exit 1
            fi
            MAG="$2"
            shift 2
            ;;
        *) break ;;
    esac
done

# ── Argument validation ────────────────────────────────────────────────────────
if [[ $# -ne 3 ]]; then
    echo "Usage:"
    echo "  Folder mode: $0 [--skip-existing] <session_date> <grid_identifier> <source_folder>"
    echo "  Direct mode: $0 [--skip-existing] --mag <low|high> <session_date> <grid_identifier> <source>"
    exit 1
fi

SESSION_DATE="$1"
GRID_ID="$2"
SOURCE="$3"

if [[ -z "$API_KEY" ]]; then
    echo "Error: CRYOEM_UPLOAD_KEY environment variable is not set."
    echo "Add this to your ~/.bashrc:"
    echo "  export CRYOEM_UPLOAD_KEY=\"your-secret-key-here\""
    exit 1
fi

if [[ -z "$UPLOAD_URL" ]]; then
    echo "Error: CRYOEM_UPLOAD_URL environment variable is not set."
    echo "Add this to your ~/.bashrc:"
    echo "  export CRYOEM_UPLOAD_URL=\"https://yoursite.com/api/screening-images/upload\""
    exit 1
fi

if [[ "$UPLOAD_URL" != https://* ]]; then
    echo "Error: UPLOAD_URL must use HTTPS to protect the API key."
    echo "Current value: $UPLOAD_URL"
    exit 1
fi

if [[ ! "$SESSION_DATE" =~ ^[0-9]{8}$ ]]; then
    echo "Error: session_date must be 8 digits (YYYYMMDD), got: $SESSION_DATE"
    exit 1
fi

if [[ ! "$GRID_ID" =~ ^[A-Za-z0-9]+g[0-9]+$ ]]; then
    echo "Error: grid_identifier format invalid (expected e.g. AB123g1), got: $GRID_ID"
    exit 1
fi

if [[ -n "$MAG" && ! "$MAG" =~ ^(low|high)$ ]]; then
    echo "Error: --mag must be 'low' or 'high', got: $MAG"
    exit 1
fi

if [[ ! -e "$SOURCE" ]]; then
    echo "Error: source does not exist: $SOURCE"
    exit 1
fi

# In folder mode, source must be a directory
if [[ -z "$MAG" && ! -d "$SOURCE" ]]; then
    echo "Error: source must be a directory containing low/ and/or high/ subfolders."
    echo "To upload a single file or flat folder, use --mag <low|high>."
    exit 1
fi

# ── Helper: fetch existing filenames on server for one mag level ───────────────
fetch_existing_files() {
    local mag="$1"
    local list_url="${UPLOAD_URL/\/upload/}/${SESSION_DATE}/${GRID_ID}"
    local response
    response=$(curl --silent --fail "$list_url" 2>/dev/null || echo '{}')
    echo "$response" | grep -o "\"${mag}\":\[[^]]*\]" | grep -o '"[^"]*\.\(jpg\|jpeg\|png\|webp\)"' | tr -d '"' || true
}

# ── Helper: upload a single file, with retries ─────────────────────────────────
# Returns 0 on success, 1 on failure.
upload_file() {
    local filepath="$1"
    local mag="$2"
    local filename
    filename="$(basename "$filepath")"
    local ext_lower
    ext_lower="${filename##*.}"
    ext_lower="${ext_lower,,}"

    if [[ ! " $ALLOWED_EXTENSIONS " =~ " $ext_lower " ]]; then
        echo "  Skipping non-image file: $filename"
        return 0
    fi

    echo -n "  Uploading $mag/$filename ... "

    local attempt=0
    local http_code="000"
    while [[ $attempt -lt $RETRY_COUNT ]]; do
        http_code=$(curl --silent --output /tmp/upload_response.json --write-out "%{http_code}" \
            -X POST "$UPLOAD_URL" \
            -H "X-API-Key: $API_KEY" \
            -F "session_date=$SESSION_DATE" \
            -F "grid_identifier=$GRID_ID" \
            -F "mag=$mag" \
            -F "file=@$filepath")
        [[ "$http_code" == "200" ]] && break
        ((attempt++)) || true
        [[ $attempt -lt $RETRY_COUNT ]] && echo -n "retry $attempt... "
    done

    if [[ "$http_code" == "200" ]]; then
        echo "OK"
        return 0
    else
        echo "FAILED (HTTP $http_code)"
        cat /tmp/upload_response.json
        echo ""
        return 1
    fi
}

# ── Helper: upload all images in a flat folder for a given mag level ───────────
# Returns number of failed uploads.
upload_image_folder() {
    local folder="$1"
    local mag="$2"

    local existing_files=""
    if [[ "$SKIP_EXISTING" == true ]]; then
        echo "  Checking existing files on server..."
        existing_files=$(fetch_existing_files "$mag")
    fi

    local count=0 skipped=0 failed=0

    for filepath in "$folder"/*; do
        [[ -f "$filepath" ]] || continue

        local filename
        filename="$(basename "$filepath")"
        local ext_lower="${filename##*.}"
        ext_lower="${ext_lower,,}"

        if [[ ! " $ALLOWED_EXTENSIONS " =~ " $ext_lower " ]]; then
            echo "  Skipping non-image file: $filename"
            continue
        fi

        if [[ "$SKIP_EXISTING" == true ]] && echo "$existing_files" | grep -qxF "$filename"; then
            echo "  Skipping (already exists): $mag/$filename"
            ((skipped++)) || true
            continue
        fi

        if upload_file "$filepath" "$mag"; then
            ((count++)) || true
        else
            ((failed++)) || true
        fi
    done

    echo "  $mag: $count uploaded, $skipped skipped, $failed failed."
    return $failed
}

# ── Main ───────────────────────────────────────────────────────────────────────
echo "Uploading screening images for $GRID_ID ($SESSION_DATE)"
echo "Source: $SOURCE"
echo "Target: $UPLOAD_URL"
[[ "$SKIP_EXISTING" == true ]] && echo "Flags:  --skip-existing"
echo ""

total_failed=0

if [[ -n "$MAG" ]]; then
    # ── Direct mode ────────────────────────────────────────────────────────────
    echo "Direct mode → $MAG/"
    if [[ -f "$SOURCE" ]]; then
        # Single file
        if [[ "$SKIP_EXISTING" == true ]]; then
            filename="$(basename "$SOURCE")"
            existing=$(fetch_existing_files "$MAG")
            if echo "$existing" | grep -qxF "$filename"; then
                echo "  Skipping (already exists): $MAG/$filename"
            else
                upload_file "$SOURCE" "$MAG" || ((total_failed++)) || true
            fi
        else
            upload_file "$SOURCE" "$MAG" || ((total_failed++)) || true
        fi
    else
        # Flat folder of images
        upload_image_folder "$SOURCE" "$MAG" || ((total_failed+=$?)) || true
    fi
else
    # ── Folder mode ────────────────────────────────────────────────────────────
    echo "Folder mode — scanning for low/ and high/ subfolders"

    # Warn about any unexpected subdirectories
    found_mag=false
    for entry in "$SOURCE"/*/; do
        [[ -d "$entry" ]] || continue
        dirname="$(basename "$entry")"
        if [[ "$dirname" == "low" || "$dirname" == "high" ]]; then
            found_mag=true
        else
            echo "  Warning: unexpected subfolder '$dirname' ignored (only 'low' and 'high' are valid)"
        fi
    done

    if [[ "$found_mag" == false ]]; then
        echo "Error: no low/ or high/ subfolders found in $SOURCE"
        echo "Use --mag <low|high> to upload a flat folder or single file directly."
        exit 1
    fi

    echo ""
    for mag in low high; do
        if [[ -d "$SOURCE/$mag" ]]; then
            upload_image_folder "$SOURCE/$mag" "$mag" || ((total_failed+=$?)) || true
        else
            echo "  No $mag/ folder found, skipping."
        fi
    done
fi

echo ""
if [[ $total_failed -gt 0 ]]; then
    echo "Done with errors: $total_failed file(s) failed to upload."
    exit 1
else
    echo "Done."
fi
