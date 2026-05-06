# ================================================================
# PVD System — Frontend Dockerfile
# ================================================================
# WHAT THIS FILE DOES:
#   1. Stage 1 (Builder):
#      - Uses Node.js 18 to install all dependencies
#      - Copies entire frontend folder (no file left behind)
#      - Builds production-ready React bundle (npm run build)
#      - Output goes to /app/dist folder
#
#   2. Stage 2 (Production):
#      - Uses lightweight nginx to serve the built React app
#      - Configures nginx to handle React Router (SPA routing)
#      - Proxies all /api/ requests to backend container
#      - Proxies all /ws/ WebSocket requests to backend container
#      - Serves on port 80
#
# ✅ Multi-stage build — final image is small (no Node.js in production)
# ✅ All frontend files included — nothing left behind
# ✅ WebSocket proxy configured for live detection feed
# ✅ React Router handled — page refresh won't give 404
# ================================================================

# ================================================================
# STAGE 1 — BUILD
# Installs dependencies and builds the React production bundle
# ================================================================
FROM node:18-alpine AS builder

# Set working directory inside container
WORKDIR /app

# ── Step 1: Copy package files first ─────────────────────────
# We copy package.json and package-lock.json BEFORE the rest
# of the source code. This is a Docker caching trick:
# If these files don't change, Docker reuses the cached
# node_modules layer and skips npm install on next build.
# This saves 2-5 minutes on rebuilds.
COPY package.json ./
COPY package-lock.json ./

# ── Step 2: Install all dependencies ─────────────────────────
# npm ci is used instead of npm install because:
#   - ci = clean install (faster and more reliable)
#   - Uses exact versions from package-lock.json
#   - Better for production/Docker builds
RUN npm ci

# ── Step 3: Copy entire frontend folder ──────────────────────
# Copies EVERYTHING — no file is left behind:
#   src/, public/, index.html, vite.config.js,
#   tailwind.config.js, postcss.config.js,
#   .env files, jsconfig.json, etc.
COPY . .

# ── Step 4: Set API URLs for production build ─────────────────
# These environment variables tell the React app where
# the backend is located at runtime.
# nginx will proxy /api/ and /ws/ to the backend container
# so the browser always talks to the same host (no CORS issues)
ARG VITE_API_URL=http://localhost:80
ARG VITE_WS_URL=ws://localhost:80

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# ── Step 5: Build production bundle ───────────────────────────
# This runs "npm run build" which:
#   - Compiles React + JSX to plain JavaScript
#   - Bundles and minifies all CSS and JS
#   - Outputs optimized files to /app/dist folder
# The dist/ folder is what nginx will serve
RUN npm run build

# ── Verify build succeeded ────────────────────────────────────
# This will fail the build immediately if dist/ was not created
# so you know right away if something went wrong
RUN test -d /app/dist && echo "Build successful — dist/ folder created" || \
    (echo "Build FAILED — dist/ folder not found" && exit 1)


# ================================================================
# STAGE 2 — PRODUCTION
# Serves the built React app using nginx
# Node.js is NOT included here — image is much smaller
# ================================================================
FROM nginx:1.25-alpine AS production

# ── Step 6: Remove default nginx config ───────────────────────
# nginx comes with a default config that conflicts with ours
RUN rm /etc/nginx/conf.d/default.conf

# ── Step 7: Copy our custom nginx config ─────────────────────
# This config handles:
#   - React Router (SPA — all routes go to index.html)
#   - /api/ proxy → backend:8000
#   - /ws/ WebSocket proxy → backend:8000
#   - Static asset caching
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ── Step 8: Copy built React files from builder stage ────────
# Only the compiled dist/ folder is copied — not source code
# This keeps the production image clean and small
COPY --from=builder /app/dist /usr/share/nginx/html

# ── Step 9: Set correct permissions ──────────────────────────
# nginx needs read access to all files it serves
RUN chmod -R 755 /usr/share/nginx/html

# ── Step 10: Expose port ─────────────────────────────────────
# nginx serves on port 80
# Access frontend at http://localhost:80 (or just http://localhost)
EXPOSE 80

# ── Step 11: Health check ────────────────────────────────────
# Checks every 30s that nginx is serving correctly
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:80 || exit 1

# ── Step 12: Start nginx ──────────────────────────────────────
# daemon off = runs nginx in foreground (required for Docker)
CMD ["nginx", "-g", "daemon off;"]
