FROM node:18-alpine

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Create upload directories
RUN mkdir -p \
  uploads/weighbridge \
  uploads/feedtests \
  uploads/pod

EXPOSE 3000

CMD ["node", "src/server.js"]

