# 使用轻量 Node 镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 拷贝依赖清单并安装依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 拷贝代码
COPY . .

# 暴露端口
EXPOSE 3001

# 生产环境变量
ENV NODE_ENV=production

# 启动服务
CMD ["npm", "run", "start"]
