#!/bin/bash
echo "=== 服务状态检查 ==="
echo ""

echo "1. Web服务 (Vite) 状态:"
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    echo "   ✅ Web服务正在运行 (端口3000)"
    PID=$(netstat -tlnp 2>/dev/null | grep ":3000 " | awk '{print $7}' | cut -d'/' -f1)
    echo "   进程ID: $PID"
else
    echo "   ❌ Web服务未运行"
fi
echo ""

echo "2. Ngrok状态:"
if ps aux | grep -v grep | grep -q "ngrok http"; then
    echo "   ✅ Ngrok正在运行"
    PID=$(ps aux | grep -v grep | grep "ngrok http" | awk '{print $2}')
    echo "   进程ID: $PID"
    
    # 获取公网URL
    URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$URL" ]; then
        echo "   公网URL: $URL"
        echo "   Ngrok Web界面: http://localhost:4040"
    fi
else
    echo "   ❌ Ngrok未运行"
fi
echo ""

echo "3. 连接测试:"
if [ -n "$URL" ]; then
    echo "   测试访问 $URL ..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null)
    if [ "$HTTP_CODE" = "200" ]; then
        echo "   ✅ 公网URL可以访问 (HTTP $HTTP_CODE)"
    else
        echo "   ⚠️  公网URL返回HTTP $HTTP_CODE"
    fi
fi
echo ""

echo "=== 访问说明 ==="
echo "1. 公网URL: $URL"
echo "2. 注意: ngrok免费版首次访问会显示警告页面，需要点击 'Visit Site' 按钮"
echo "3. 查看ngrok状态: curl http://localhost:4040/api/tunnels"
