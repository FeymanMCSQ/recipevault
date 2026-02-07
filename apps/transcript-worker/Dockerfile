# Transcript Worker - yt-dlp based YouTube subtitle extraction
FROM node:22-slim

# Install dependencies including python, ffmpeg, curl, unzip, build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    ffmpeg \
    curl \
    unzip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp with curl-cffi for impersonation support
# --break-system-packages is needed on modern Debian/Node images
RUN pip3 install --no-cache-dir --break-system-packages "yt-dlp[default,curl-cffi]"

# Verify curl_cffi installation
RUN python3 -c "import curl_cffi; print('curl_cffi installed successfully')"

# Install Deno (required for yt-dlp JS challenges)
ARG DENO_VERSION=1.40.2
RUN curl -fsSL https://deno.land/x/install/install.sh | sh -s v${DENO_VERSION} \
    && mv /root/.deno/bin/deno /usr/local/bin/deno

# Set environment variables
ENV YT_DLP_PATH=yt-dlp
ENV DENO_PATH=/usr/local/bin/deno

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install -g pnpm && npm install

# Copy source
COPY src ./src

# Build
RUN npm run build


# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]
