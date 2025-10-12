# 开发环境 Dockerfile
FROM node:18-alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

# 设置工作目录
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 复制 package 文件
COPY package*.json ./

# 安装依赖（利用 Docker 层缓存）
RUN npm ci && npm cache clean --force

# 复制源代码
COPY . .

# 设置开发环境变量
ENV NODE_ENV=development

# 传入并导出构建期环境变量（供 Vite 读取）
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# 更改文件所有权
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3003

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3003 || exit 1

# 启动开发服务器
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
