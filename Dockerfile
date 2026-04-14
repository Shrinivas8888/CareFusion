# ---------- STEP 1: Build Frontend ----------
FROM node:18 AS build

WORKDIR /app

COPY frontend/package*.json ./frontend/
RUN cd frontend && npm install

COPY frontend ./frontend
RUN cd frontend && npm run build

# ---------- STEP 2: Backend ----------
FROM node:18

WORKDIR /app

# backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# backend code
COPY backend ./backend

# frontend build copy
COPY --from=build /app/frontend/build ./frontend/build

WORKDIR /app/backend

EXPOSE 5000

# start server
CMD ["node", "server.js"]