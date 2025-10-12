#!/bin/bash

# IM系统前端集成测试脚本

echo "🚀 开始前端集成测试..."

# 检查Node.js版本
echo "📋 检查环境..."
node --version
npm --version

# 进入frontend_production目录
cd frontend_production

# 安装依赖
echo "📦 安装前端依赖..."
npm install

# 检查TypeScript编译
echo "🔍 检查TypeScript编译..."
npm run type-check

# 检查ESLint
echo "🔍 检查代码质量..."
npm run lint

# 构建项目
echo "🏗️ 构建前端项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 前端集成测试成功！"
    echo "📁 构建文件位于: frontend_production/dist/"
    echo "🌐 可以通过以下方式启动:"
    echo "   - 开发模式: npm run dev"
    echo "   - 预览模式: npm run preview"
    echo "   - Docker: docker-compose up"
else
    echo "❌ 前端集成测试失败！"
    exit 1
fi
