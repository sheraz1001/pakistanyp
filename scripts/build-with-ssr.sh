#!/bin/bash
set -e

echo "🔨 Building client assets..."
vite build

echo "🔨 Building SSR server bundle..."
vite build --ssr src/entry-server.tsx --outDir ../dist/server --emptyOutDir false

echo "🔨 Building Express server..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo "✅ Full build complete with SSR support!"
echo "SSR bundle: dist/server/entry-server.js"
