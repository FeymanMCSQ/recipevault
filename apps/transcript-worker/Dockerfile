# Transcript Worker - yt-dlp based YouTube subtitle extraction
FROM node:20-slim

# Install dependencies including python, ffmpeg, curl, unzip
RUN apt-get update && apt-get install -y \
    python3 \
    ffmpeg \
    curl \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

# Install Deno (required for yt-dlp JS challenges)
ARG DENO_VERSION=1.40.2
RUN curl -fsSL https://deno.land/x/install/install.sh | sh -s v${DENO_VERSION} \
    && mv /root/.deno/bin/deno /usr/local/bin/deno

# Set environment variables
ENV YT_DLP_PATH=/usr/local/bin/yt-dlp
ENV DENO_PATH=/usr/local/bin/deno

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source
COPY src ./src

# Build
RUN npm run build


# Expose port
EXPOSE 3001

# Start
CMD ["npm", "start"]
