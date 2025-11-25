# Ngrok访问说明

## 当前服务状态

 **所有服务正常运行**

- Web服务 (Vite): 运行在端口 3000
- Ngrok隧道: 已建立
- 后端API: 运行在端口 8000

## 公网访问地址

**主URL:** https://gertrude-unsustaining-derisively.ngrok-free.dev

## 重要提示

### 1. Ngrok免费版警告页面

ngrok免费版首次访问时会显示一个警告页面，这是正常现象。需要：
- 点击页面上的 **"Visit Site"** 或 **"Continue"** 按钮
- 之后就可以正常访问你的web应用了

### 2. 访问步骤

1. 在浏览器中打开: https://gertrude-unsustaining-derisively.ngrok-free.dev
2. 如果看到ngrok警告页面，点击 "Visit Site" 按钮
3. 等待页面加载完成

### 3. 如果无法访问

**检查清单:**
- [ ] 确认所有服务都在运行: `./check_status.sh`
- [ ] 检查浏览器控制台是否有错误 (F12)
- [ ] 确认网络连接正常
- [ ] 尝试清除浏览器缓存
- [ ] 检查防火墙设置

**查看服务状态:**
```bash
cd /root/autodl-tmp/story-web
./check_status.sh
```

**查看日志:**
```bash
# Web服务日志
tail -f web.log

# Ngrok日志
tail -f ngrok.log
```

## 管理脚本

### 启动所有服务
```bash
cd /root/autodl-tmp/story-web
./start_services.sh
```

### 检查服务状态
```bash
cd /root/autodl-tmp/story-web
./check_status.sh
```

### 停止服务
```bash
# 停止Web服务
pkill -f "vite"

# 停止Ngrok
pkill -f "ngrok http"
```

## Ngrok Web界面

Ngrok访问说明Ngrok访问说明grok管理界面查看详细信息:
- URL: http://localhost:4040
- 功能: 查看请求日志、隧道状态等

## 获取最新公网URL

ngrok重启，URL可能会变化。获取最新URL:
```bash
curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"[^"]*"' | head -1
```

## 注意事项

1. **URL会变化**: ngrok免费版的URL每次重启可能会变化
2. **流量限制**: ngrok免费版有流量和连接数限制
3. **HTTPS**: ngrok自动提供HTTPS加密
4. **API代理**: Web应用通过vite代理访问后端API (localhost:8000)

## 故障排除

### 问题: 页面显示ngrok警告但无法继续
**解决**: 清除浏览器缓存，或使用无痕模式访问

### 问题: 页面加载但API请求失败
**解决**: 检查后端API服务是否运行 (端口8000)

### 问题: 服务启动失败
**解决**: 查看对应日志文件 (web.log 或 ngrok.log)
