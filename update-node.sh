#!/bin/bash

# Script cập nhật Node.js lên version 22+ cho dự án Quartz
# Yêu cầu: nvm đã được cài đặt

set -e

echo "🔍 Đang kiểm tra Node version hiện tại..."

# Load nvm nếu chưa được load
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

CURRENT_NODE=$(node --version 2>/dev/null || echo "none")
echo "📌 Node version hiện tại: ${CURRENT_NODE}"

# Kiểm tra yêu cầu version từ package.json
REQUIRED_NODE="22"
echo "📋 Yêu cầu Node version: >= ${REQUIRED_NODE}"

# Kiểm tra xem version hiện tại có đáp ứng yêu cầu không
if [[ "$CURRENT_NODE" != "none" ]]; then
    CURRENT_MAJOR=$(echo "$CURRENT_NODE" | sed 's/v\([0-9]*\).*/\1/')
    if [[ "$CURRENT_MAJOR" -ge "$REQUIRED_NODE" ]]; then
        echo "✅ Node version hiện tại đã đáp ứng yêu cầu!"
        node --version
        npm --version
        exit 0
    fi
fi

echo ""
echo "⬇️  Đang cài đặt Node.js ${REQUIRED_NODE}..."

# Cài đặt Node 22 (LTS hoặc latest)
if ! nvm install "$REQUIRED_NODE" --latest-npm; then
    echo "❌ Lỗi khi cài đặt Node ${REQUIRED_NODE}. Đang thử cài đặt LTS version..."
    nvm install --lts --latest-npm
fi

# Sử dụng Node 22
nvm use "$REQUIRED_NODE"
nvm alias default "$REQUIRED_NODE"

echo ""
echo "✅ Hoàn tất cập nhật!"
echo "📌 Node version mới: $(node --version)"
echo "📌 npm version: $(npm --version)"

# Kiểm tra npm version
CURRENT_NPM=$(npm --version)
REQUIRED_NPM="10.9.2"
if ! command -v node-semver &> /dev/null; then
    # Kiểm tra cơ bản (chỉ so sánh major version)
    CURRENT_NPM_MAJOR=$(echo "$CURRENT_NPM" | cut -d. -f1)
    REQUIRED_NPM_MAJOR=$(echo "$REQUIRED_NPM" | cut -d. -f1)
    if [[ "$CURRENT_NPM_MAJOR" -ge "$REQUIRED_NPM_MAJOR" ]]; then
        echo "✅ npm version đã đáp ứng yêu cầu (>= ${REQUIRED_NPM})"
    else
        echo "⚠️  npm version hiện tại: ${CURRENT_NPM}, yêu cầu: >= ${REQUIRED_NPM}"
        echo "🔄 Đang cập nhật npm..."
        npm install -g npm@latest
        echo "✅ npm đã được cập nhật: $(npm --version)"
    fi
fi

echo ""
echo "🎉 Cài đặt hoàn tất! Bạn có thể chạy dự án ngay bây giờ."
echo ""
echo "💡 Lưu ý: Nếu bạn mở terminal mới, hãy đảm bảo nvm đã được load trong ~/.zshrc hoặc ~/.bash_profile"
