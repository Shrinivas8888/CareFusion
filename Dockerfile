# Step 1: Build frontend
FROM node:18 AS build

WORKDIR /app

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Step 2: Backend setup
FROM node:20

WORKDIR /app

COPY backend ./backend

# frontend build copy
COPY --from=build /app/frontend/dist ./frontend/build

WORKDIR /app/backend
RUN npm install

EXPOSE 5000

CMD ["node", "server.js"]