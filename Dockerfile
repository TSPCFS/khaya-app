FROM node:22-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm install --producton

COPY . .

# Create db directory and seed if needed at runtime
# (Railway volume will mount over /app/db for persistence)

EXPOSE 5050

ENV NODE_ENV=production
ENV PORT=5050

CMD ["sh", "-c", "node db/seed-if-needed.js && node server.js"]
