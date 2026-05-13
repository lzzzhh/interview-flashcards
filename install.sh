#!/bin/bash
set -e

# ============================================================
# 面经闪卡 — 一键安装脚本
# 自动检测平台，下载最新 Release 安装
# ============================================================

REPO="your-username/interview-flashcards"
APP_NAME="面经闪卡"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════╗"
echo "  ║    📚 面经闪卡 — 一键安装       ║"
echo "  ╚══════════════════════════════════╝"
echo -e "${NC}"

# ---- 检测平台 ----
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin)
    PLATFORM="macos"
    if [ "$ARCH" = "arm64" ]; then
      ARCH_NAME="aarch64"
      EXT="dmg"
    else
      ARCH_NAME="x86_64"
      EXT="dmg"
    fi
    ;;
  Linux)
    PLATFORM="linux"
    ARCH_NAME="amd64"
    EXT="AppImage"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    echo -e "${RED}Windows 请手动下载 .exe 安装包${NC}"
    echo "  https://github.com/$REPO/releases"
    exit 1
    ;;
  *)
    echo -e "${RED}不支持的操作系统: $OS${NC}"
    exit 1
    ;;
esac

echo "  平台: $PLATFORM ($ARCH_NAME)"

# ---- 获取最新 Release ----
echo "  正在查找最新版本..."
LATEST_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url" | grep "$PLATFORM" | grep "$ARCH_NAME" | head -1 | cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
  echo -e "${RED}未找到 $PLATFORM ($ARCH_NAME) 的安装包${NC}"
  echo "  请访问: https://github.com/$REPO/releases"
  exit 1
fi

VERSION=$(echo "$LATEST_URL" | grep -o 'v[0-9.]*' | head -1)
echo "  最新版本: $VERSION"

# ---- 下载 ----
TMP_DIR=$(mktemp -d)
FILENAME="${APP_NAME}_${VERSION}_${PLATFORM}_${ARCH_NAME}.${EXT}"
echo "  正在下载 $FILENAME ..."
curl -L -# -o "$TMP_DIR/$FILENAME" "$LATEST_URL"

# ---- 安装 ----
case "$PLATFORM" in
  macos)
    echo "  正在挂载 DMG..."
    hdiutil attach "$TMP_DIR/$FILENAME" -quiet
    echo "  正在复制到 /Applications..."
    cp -R "/Volumes/$APP_NAME/$APP_NAME.app" /Applications/ 2>/dev/null || true
    hdiutil detach "/Volumes/$APP_NAME" -quiet 2>/dev/null || true
    echo ""
    echo -e "${GREEN}✅ 安装完成！${NC}"
    echo "  在 /Applications 中找到「面经闪卡」并打开"
    echo "  或运行: open /Applications/面经闪卡.app"
    ;;
  linux)
    chmod +x "$TMP_DIR/$FILENAME"
    echo "  移动到 ~/Applications/"
    mkdir -p ~/Applications
    mv "$TMP_DIR/$FILENAME" ~/Applications/
    echo ""
    echo -e "${GREEN}✅ 安装完成！${NC}"
    echo "  运行: ~/Applications/$FILENAME"
    ;;
esac

# ---- 清理 ----
rm -rf "$TMP_DIR"

echo ""
echo -e "${CYAN}  数据文件: ~/Documents/interview-flashcards/data.json${NC}"
echo -e "${CYAN}  同步方式: 放入 iCloud/Dropbox 文件夹即可跨设备同步${NC}"
