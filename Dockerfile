# Stage 1: Build Backend & Frontend
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install server dependencies & build server
COPY server/package*.json ./server/
RUN cd server && npm install

COPY server ./server
RUN cd server && npx prisma generate && npm run build

# Install client dependencies & build client
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client ./client
RUN cd client && npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
ENV NODE_ENV=production

# Copy built server
COPY --from=builder /app/server ./server

# Copy built client
COPY --from=builder /app/client ./client

# Copy startup script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 10000

CMD ["./docker-entrypoint.sh"]
