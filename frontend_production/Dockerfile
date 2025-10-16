# ==============================
# Stage 1: Build with Node
# ==============================
FROM node:18-alpine AS build
WORKDIR /app

# 拷贝依赖文件并安装依赖
COPY package*.json ./
RUN npm ci

# 拷贝全部源码并构建
COPY . .
RUN npm run build

# ==============================
# Stage 2: Serve with Nginx
# ==============================
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# 从上一步复制构建结果
COPY --from=build /app/dist ./

# 可选: 自定义 Nginx 配置（如有）
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3003
CMD ["nginx", "-g", "daemon off;"]