FROM node:22-alpine AS builder

WORKDIR /app

COPY . .

RUN npm run check \
  && npm test \
  && npm run build

FROM nginx:1.28-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

