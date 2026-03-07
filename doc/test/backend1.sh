#!/bin/bash

# 创建日志目录
mkdir -p ./backend/logs

# 生成日志文件名
log_file="./backend/logs/visualization_$(date '+%Y%m%d_%H%M%S').log"

# 从git配置中获取用户名
current_user=$(git config user.name)

# 记录启动信息
echo "$(date '+%Y-%m-%d %H:%M:%S') - 服务启动 - 用户: $current_user" | tee -a "$log_file"

# 根据用户名执行不同的命令
if [ "$current_user" = "luhuifang" ]; then
elif [ "$current_user" = "hujing1" ]; then
    /.python.exe ./visualization.py 2>&1 | tee -a "$log_file"
else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 错误: 未知用户: $current_user" | tee -a "$log_file"
    echo "可能你还未配置git config name and email"
    echo "使用git config --global user.name 'your_name' 和 git config --global user.email 'your_email@example.com' 配置"
    exit 1
fi
