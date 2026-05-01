# Build script for Render deployment
# Installs deps for both backend and frontend, then builds the frontend

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build
