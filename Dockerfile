# Stage 1: Build
FROM node:22-slim AS builder
WORKDIR /app

# 使用中国可访问的 npm 镜像（加速下载，避免网络问题）
RUN yarn config set registry https://registry.npmmirror.com

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .

# Enable standalone output for minimal production image
RUN yarn build

# Stage 2: Production
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 16010

ENV PORT=16010
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]