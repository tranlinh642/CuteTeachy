FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Kích hoạt pnpm (có sẵn trong Node 18+)
RUN corepack enable

# --- GIAI ĐOẠN 1: Tách riêng phần Web (Dùng cho Production) ---
FROM base AS builder
WORKDIR /app
RUN pnpm add -g turbo
COPY . .
# Lọc ra đúng thư mục web và các package dùng chung (database, api, types)
RUN turbo prune web --docker

# --- GIAI ĐOẠN 2: Development (Dùng khi bạn code) ---
FROM base AS development
WORKDIR /app
# Copy toàn bộ file cấu hình package từ kết quả prune
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
# Cài đặt thư viện
RUN pnpm install

# Code thực tế sẽ được Mount từ máy của bạn vào qua docker-compose
# Lệnh chạy:
CMD ["pnpm", "dev", "--filter", "web"]
