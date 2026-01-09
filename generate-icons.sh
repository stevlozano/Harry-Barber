#!/bin/bash
# Simple icon generator for PWA

# Create a basic icon from the logo if it exists
LOGO_PATH="images/logo/logo.png"
ICON_DIR="images/icons"

# If logo exists, create resized versions
if [ -f "$LOGO_PATH" ]; then
    echo "Generating icons from existing logo..."
    # This would require ImageMagick or similar
    # For now, we'll note that icons need to be created manually
    echo "Please create the following icon sizes in $ICON_DIR:"
    echo "- icon-72x72.png"
    echo "- icon-96x96.png" 
    echo "- icon-128x128.png"
    echo "- icon-144x144.png"
    echo "- icon-152x152.png"
    echo "- icon-192x192.png"
    echo "- icon-384x384.png"
    echo "- icon-512x512.png"
else
    echo "No logo found at $LOGO_PATH"
    echo "Creating placeholder icons..."
    # Create simple placeholder icons
    for size in 72 96 128 144 152 192 384 512; do
        echo "Would create icon-${size}x${size}.png"
    done
fi

echo "Icon generation script completed."
echo "For production, use a proper icon generator or design tool."