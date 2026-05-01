#!/usr/bin/env bash
# Build script for Render deployment
# Installs deps for both backend and frontend, then builds the frontend

# Install backend dependencies (production only — no dev deps needed)
cd backend
npm install --production

# Install frontend dependencies (need devDeps like vite for building)
cd ../frontend
npm install --include=dev
npm run build
