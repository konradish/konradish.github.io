#!/bin/bash

# Ensure the directory exists
mkdir -p "$(dirname "$0")"

# Convert SVG to PNG
echo "Converting SVG to PNG..."
rsvg-convert -w 512 -h 512 ../../favicon.svg -o favicon.png

# Create different sizes
echo "Creating different sizes..."
convert favicon.png -resize 16x16 favicon-16.png
convert favicon.png -resize 32x32 favicon-32.png
convert favicon.png -resize 48x48 favicon-48.png

# Create ICO file
echo "Creating ICO file..."
convert favicon-16.png favicon-32.png favicon-48.png ../../favicon.ico

echo "Done! Favicon files have been created."