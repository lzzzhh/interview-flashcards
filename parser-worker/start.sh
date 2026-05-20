#!/bin/bash
# parser-worker/start.sh — 启动 Python 文档解析 Worker
# 用法: ./start.sh [port]
# 默认端口: 8000

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"
PORT="${1:-8000}"

echo "📄 面经闪卡 — 文档解析 Worker"
echo ""

# 创建虚拟环境
if [ ! -d "$VENV_DIR" ]; then
  echo "⚙️  创建 Python 虚拟环境..."
  python3 -m venv "$VENV_DIR"
fi

# 激活虚拟环境
source "$VENV_DIR/bin/activate"

# 安装依赖
echo "📦 安装依赖..."
pip install -q -r "$SCRIPT_DIR/requirements.txt"

# 启动服务
echo "🚀 启动解析服务 (端口: $PORT)..."
echo ""
uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload
