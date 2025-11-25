#!/bin/bash
# 启动Web服务和Ngrok的脚本

cd /root/autodl-tmp/story-web

echo "=== 启动服务 ==="

# 检查并停止旧进程
echo "1. 清理旧进程..."
pkill -f "vite" 2>/dev/null
pkill -f "ngrok http" 2>/dev/null
sleep 2

# 启动Web服务
echo "2. 启动Web服务 (Vite)..."
nohup npm run dev > web.log 2>&1 &
WEB_PID=$!
sleep 3

# 检查Web服务是否启动成功
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "   ✅ Web服务启动成功 (PID: $WEB_PID)"
else
    echo "   ❌ Web服务启动失败，请查看 web.log"
    exit 1
fi

# 启动Ngrok
echo "3. 启动Ngrok..."
nohup ngrok http 3000 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!
sleep 5

# 检查Ngrok是否启动成功
if ps aux | grep -v grep | grep -q "ngrok http"; then
    echo "   ✅ Ngrok启动成功 (PID: $NGROK_PID)"
    
    # 获取公网URL
    sleep 2
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$URL" ]; then
        echo ""
        echo "=== 服务已启动 ==="
        echo "公网URL: $URL"
        echo "本地URL: http://localhost:3000"
        echo "Ngrok Web界面: http://localhost:4040"
        echo ""
        echo "查看日志:"
        echo "  Web服务: tail -f web.log"
        echo "  Ngrok: tail -f ngrok.log"
    fi
else
    echo "   ❌ Ngrok启动失败，请查看 ngrok.log"
    exit 1
fi
