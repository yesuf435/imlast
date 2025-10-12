# 使用官方 Node.js 18 Alpine 镜像
FROM node:18-alpine

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

# 传入并导出构建期环境变量（供 Vite 读取）
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# 更改文件所有权
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# 构建生产版本
RUN npm run build

# 启动生产服务器
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
