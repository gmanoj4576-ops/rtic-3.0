#!/bin/bash
set -e

WORKSPACE_DIR="/Users/manojmanu/Desktop/untitled folder/project website"
NODE_DIR="$WORKSPACE_DIR/.node_env"

if [ -f "$NODE_DIR/bin/node" ]; then
  echo "Local Node.js already configured at $NODE_DIR"
  exit 0
fi

echo "Creating node environment folder..."
mkdir -p "$NODE_DIR"

echo "Downloading Node.js v20.11.0 for macOS x64..."
curl -L -s https://nodejs.org/dist/v20.11.0/node-v20.11.0-darwin-x64.tar.gz -o /tmp/node-darwin.tar.gz

echo "Extracting Node.js package..."
tar -xzf /tmp/node-darwin.tar.gz -C "$NODE_DIR" --strip-components=1

echo "Cleaning up temp files..."
rm /tmp/node-darwin.tar.gz

echo "Verifying local Node.js installation..."
"$NODE_DIR/bin/node" --version
"$NODE_DIR/bin/npm" --version

echo "Local Node.js environment configured successfully!"
