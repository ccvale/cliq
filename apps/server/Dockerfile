# Cliq API. Build from apps/server:  docker build -t cliq-api .
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY tsconfig.json ./
EXPOSE 4000
USER node
CMD ["npx", "tsx", "src/index.ts"]
