#!/bin/bash
# Quick start script for InstaTracker

echo "🚀 Starting InstaTracker..."
echo ""

# Start backend
echo "Starting Backend (port 5000)..."
cd backend && npm install --silent && npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting Frontend (port 3000)..."
cd ../frontend && npm install --silent && npm start &
FRONTEND_PID=$!

echo ""
echo "✅ InstaTracker is running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both
wait $BACKEND_PID $FRONTEND_PID
