# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and env
COPY package*.json ./
COPY .env ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files and env
COPY package*.json ./
COPY package-lock.json ./
COPY .env ./
RUN npm ci --only=production
RUN npm install dotenv

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose port from .env or default to 4000
EXPOSE ${PORT:-4000}

# Start the application with environment variables
CMD ["node", "dist/index.js"]
