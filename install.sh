#!/bin/bash
set -e

# ============================================================
# 面经闪卡 — 一键安装脚本
# 自动检测平台，下载最新 Release 安装
# ============================================================

REPO="lzzzhh/interview-flashcards"
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
      ARCH_PATTERN="aarch64.dmg"
      EXT="dmg"
    else
      ARCH_PATTERN="x64.dmg"
      EXT="dmg"
    fi
    INSTALL_CMD='hdiutil attach "$DL" -quiet && cp -R "/Volumes/面经闪卡/面经闪卡.app" /Applications/ && hdiutil detach "/Volumes/面经闪卡" -quiet'
    ;;
  Linux)
    PLATFORM="linux"
    ARCH_PATTERN="amd64.deb"
    EXT="deb"
    INSTALL_CMD='sudo dpkg -i "$DL"'
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

echo "  平台: $PLATFORM"

# ---- 获取最新 Release ----
echo "  正在查找最新版本..."
LATEST_URL=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep "browser_download_url" | grep "$ARCH_PATTERN" | head -1 | cut -d '"' -f 4)

if [ -z "$LATEST_URL" ]; then
  echo -e "${RED}未找到 ${PLATFORM} 安装包${NC}"
  echo "  请访问: https://github.com/$REPO/releases"
  exit 1
fi

echo "  下载地址: $LATEST_URL"

# ---- 下载 ----
TMP_DIR=$(mktemp -d)
DL_FILE="$TMP_DIR/面经闪卡.${EXT}"
echo "  正在下载..."
curl -L -# -o "$DL_FILE" "$LATEST_URL"

# ---- 安装 ----
case "$PLATFORM" in
  macos)
    echo "  正在挂载 DMG..."
    hdiutil attach "$DL_FILE" -quiet
    echo "  正在复制到 /Applications..."
    cp -R "/Volumes/面经闪卡/面经闪卡.app" /Applications/ 2>/dev/null || true
    hdiutil detach "/Volumes/面经闪卡" -quiet 2>/dev/null || true
    xattr -cr /Applications/面经闪卡.app 2>/dev/null || true
    echo ""
    echo -e "${GREEN}✅ 安装完成！${NC}"
    echo "  运行: open /Applications/面经闪卡.app"
    ;;
  linux)
    echo "  正在安装..."
    sudo dpkg -i "$DL_FILE"
    echo ""
    echo -e "${GREEN}✅ 安装完成！${NC}"
    ;;
esac

# ---- 清理 ----
rm -rf "$TMP_DIR"

echo ""
echo -e "${CYAN}  数据文件: ~/Documents/interview-flashcards/data.json${NC}"
echo -e "${CYAN}  同步方式: 放入 iCloud/Dropbox 文件夹即可跨设备同步${NC}"
