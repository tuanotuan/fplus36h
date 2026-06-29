FROM node:24-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
RUN mkdir -p data \
  && chown -R node:node data

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-8787}/health || exit 1

CMD ["npm", "start"]
