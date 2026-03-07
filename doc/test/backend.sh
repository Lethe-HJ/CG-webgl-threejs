#!/bin/bash

# 获取脚本所在目录的父目录（项目根目录）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 切换到项目根目录
cd "$PROJECT_ROOT"

# 创建pid目录（如果不存在）
mkdir -p ./backend/pid
mkdir -p ./backend/logs

# 检查配置文件是否存在
CONFIG_FILE="./scripts/backend-config.sh"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "错误: 配置文件 $CONFIG_FILE 不存在"
    echo ""
    echo "请按照 doc/install.md 中 '## 配置后端服务的启动命令' 部分的指示进行配置"
    exit 1
fi

# 加载配置文件
source "$CONFIG_FILE"

# 定义PID文件路径
VISUALIZATION_PID_FILE="./backend/pid/visualization-service.pid"
PROCESS_PID_FILE="./backend/pid/process-service.pid"
ANALYSES_PID_FILE="./backend/pid/analyses-service.pid"

# 定义服务名称
SERVICE_VISUALIZATION="visualization"
SERVICE_PROCESS="process"
SERVICE_ANALYSES="analyses"

# 从git配置中获取用户名
current_user=$(git config user.name)
if [ -z "$current_user" ]; then
    echo "错误: 未配置 git user.name"
    echo ""
    echo "请先配置 git 用户名："
    echo "  git config --global user.name '你的用户名'"
    echo ""
    echo "然后按照 doc/install.md 中 '## 配置后端服务的启动命令' 部分的指示进行配置"
    exit 1
fi

# 检查用户是否存在于配置文件中
check_user_exists() {
    local user=$1
    # 检查任意一个服务配置是否存在即可判断用户是否存在
    local var_name="USER_${user}_visualization"
    if [ -n "${!var_name}" ]; then
        return 0
    else
        return 1
    fi
}

# 从配置文件中读取服务命令
get_service_command() {
    local user=$1
    local service=$2
    local var_name="USER_${user}_${service}"
    
    # 使用间接引用获取变量值
    if [ -n "${!var_name}" ]; then
        echo "${!var_name}"
    else
        echo ""
    fi
}

# 获取PID文件路径
get_pid_file() {
    local service=$1
    case "$service" in
        "$SERVICE_VISUALIZATION")
            echo "$VISUALIZATION_PID_FILE"
            ;;
        "$SERVICE_PROCESS")
            echo "$PROCESS_PID_FILE"
            ;;
        "$SERVICE_ANALYSES")
            echo "$ANALYSES_PID_FILE"
            ;;
        *)
            echo ""
            ;;
    esac
}

# 获取服务显示名称
get_service_display_name() {
    local service=$1
    case "$service" in
        "$SERVICE_VISUALIZATION")
            echo "可视化服务"
            ;;
        "$SERVICE_PROCESS")
            echo "处理服务"
            ;;
        "$SERVICE_ANALYSES")
            echo "分析服务"
            ;;
        *)
            echo "$service"
            ;;
    esac
}

# 检查服务状态
check_service_status() {
    local service=$1
    if [ -z "$service" ] || [ "$service" = "all" ]; then
        echo "服务状态检查:"
        echo "----------------------------------------"
        
        for svc in "$SERVICE_VISUALIZATION" "$SERVICE_PROCESS" "$SERVICE_ANALYSES"; do
            local pid_file=$(get_pid_file "$svc")
            local display_name=$(get_service_display_name "$svc")
            echo "$display_name:"
            if [ -f "$pid_file" ]; then
                local pid=$(cat "$pid_file")
                if ps -p $pid >/dev/null 2>&1; then
                    echo "  状态: 运行中 (PID: $pid)"
                else
                    echo "  状态: 未运行 (PID文件存在但进程不存在)"
                fi
            else
                echo "  状态: 未运行"
            fi
            echo "----------------------------------------"
        done
    else
        local pid_file=$(get_pid_file "$service")
        local display_name=$(get_service_display_name "$service")
        if [ -z "$pid_file" ]; then
            echo "错误: 未知的服务名: $service"
            exit 1
        fi
        echo "$display_name 状态:"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p $pid >/dev/null 2>&1; then
                echo "  状态: 运行中 (PID: $pid)"
            else
                echo "  状态: 未运行 (PID文件存在但进程不存在)"
            fi
        else
            echo "  状态: 未运行"
        fi
    fi
    exit 0
}

# 优雅停止进程：先发 SIGINT（等同 Ctrl+C），超时后再强制 kill -9
check_and_kill_process() {
    local pid_file=$1
    local service_name=$2

    if [ -f "$pid_file" ]; then
        local old_pid=$(cat "$pid_file")
        if ps -p $old_pid >/dev/null 2>&1; then
            echo "发现已存在的${service_name}进程 (PID: $old_pid)，尝试发送 SIGINT 优雅退出..."
            kill -s SIGINT $old_pid 2>/dev/null || kill $old_pid 2>/dev/null

            # 等待进程自行清理退出，最多等待 10 秒
            for i in {1..3}; do
                if ! ps -p $old_pid >/dev/null 2>&1; then
                    echo "进程已优雅退出"
                    break
                fi
                sleep 1
            done

            # 如果仍然存活，最后再强制 kill -9
            if ps -p $old_pid >/dev/null 2>&1; then
                echo "进程未在超时内退出，执行强制终止 kill -9..."
                kill -9 $old_pid 2>/dev/null
            fi
        fi
        rm -f "$pid_file"
    fi
}

# 内部停止服务函数（不退出脚本）
_stop_service_internal() {
    local service=$1
    if [ -z "$service" ] || [ "$service" = "all" ]; then
        echo "正在停止所有服务..."
        check_and_kill_process "$VISUALIZATION_PID_FILE" "可视化服务"
        check_and_kill_process "$PROCESS_PID_FILE" "处理服务"
        check_and_kill_process "$ANALYSES_PID_FILE" "分析服务"
        echo "所有服务已停止"
    else
        local pid_file=$(get_pid_file "$service")
        local display_name=$(get_service_display_name "$service")
        if [ -z "$pid_file" ]; then
            echo "错误: 未知的服务名: $service"
            return 1
        fi
        echo "正在停止${display_name}..."
        check_and_kill_process "$pid_file" "$display_name"
        echo "${display_name}已停止"
    fi
}

# 停止服务（对外接口，会退出脚本）
stop_service() {
    _stop_service_internal "$1"
    exit 0
}

# 显示日志
show_logs() {
    local service=$1
    local log_files=()
    
    if [ -z "$service" ] || [ "$service" = "all" ]; then
        # 查找所有服务的最新日志文件
        for svc in "$SERVICE_VISUALIZATION" "$SERVICE_PROCESS" "$SERVICE_ANALYSES"; do
            local log_prefix=""
            case "$svc" in
                "$SERVICE_VISUALIZATION")
                    log_prefix="visualization"
                    ;;
                "$SERVICE_PROCESS")
                    log_prefix="process"
                    ;;
                "$SERVICE_ANALYSES")
                    log_prefix="analyses"
                    ;;
            esac
            
            local latest_log=$(ls -t ./backend/logs/${log_prefix}_*.log 2>/dev/null | head -n1)
            if [ -n "$latest_log" ] && [ -f "$latest_log" ]; then
                log_files+=("$latest_log")
            fi
        done
    else
        local log_prefix=""
        case "$service" in
            "$SERVICE_VISUALIZATION")
                log_prefix="visualization"
                ;;
            "$SERVICE_PROCESS")
                log_prefix="process"
                ;;
            "$SERVICE_ANALYSES")
                log_prefix="analyses"
                ;;
            *)
                echo "错误: 未知的服务名: $service"
                exit 1
                ;;
        esac
        
        local latest_log=$(ls -t ./backend/logs/${log_prefix}_*.log 2>/dev/null | head -n1)
        if [ -n "$latest_log" ] && [ -f "$latest_log" ]; then
            log_files+=("$latest_log")
        fi
    fi
    
    if [ ${#log_files[@]} -eq 0 ]; then
        echo "错误: 未找到日志文件"
        exit 1
    fi
    
    # 执行 tail -f 查看日志
    tail -f "${log_files[@]}"
}

# 启动服务
start_service() {
    local service=$1
    local pid_file=$(get_pid_file "$service")
    local display_name=$(get_service_display_name "$service")
    
    if [ -z "$pid_file" ]; then
        echo "错误: 未知的服务名: $service"
        exit 1
    fi

    # 检查并杀死已存在的进程
    check_and_kill_process "$pid_file" "$display_name"

    # 检查用户是否存在
    if ! check_user_exists "$current_user"; then
        echo "错误: 未知用户 '$current_user'"
        echo ""
        echo "请按照 doc/install.md 中 '## 配置后端服务的启动命令' 部分的指示进行配置"
        echo "需要在 $CONFIG_FILE 中添加用户 '$current_user' 的配置"
        exit 1
    fi
    
    # 获取服务命令
    local service_command=$(get_service_command "$current_user" "$service")
    if [ -z "$service_command" ]; then
        echo "错误: 用户 '$current_user' 未配置服务 '$service'"
        echo ""
        echo "请按照 doc/install.md 中 '## 配置后端服务的启动命令' 部分的指示进行配置"
        echo "需要在 $CONFIG_FILE 中为用户 '$current_user' 添加服务 '$service' 的启动命令"
        exit 1
    fi

    # 生成带时间戳的日志文件名
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local log_file="./backend/logs/${service}_${timestamp}.log"

    # 记录启动信息
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 服务启动 - 用户: $current_user" | tee -a "$log_file"

    # 设置Python的默认编码为UTF-8并运行应用
    export PYTHONIOENCODING=utf-8

    # 启动服务（使用bash执行完整命令）
    bash -c "$service_command" >"${log_file}" 2>&1 &
    local service_pid=$!

    echo $service_pid >"$pid_file"

    echo "${display_name}已启动, PID: $service_pid, 日志文件:"
    echo "${log_file}"
}

# 交互式选择服务
interactive_select_service() {
    echo "请选择要操作的服务:"
    echo "1) 可视化服务 (visualization)"
    echo "2) 处理服务 (process)"
    echo "3) 分析服务 (analyses)"
    echo "4) 所有服务"
    echo ""
    read -p "请输入选项 (1-4): " choice

    case "$choice" in
        1)
            selected_service="$SERVICE_VISUALIZATION"
            ;;
        2)
            selected_service="$SERVICE_PROCESS"
            ;;
        3)
            selected_service="$SERVICE_ANALYSES"
            ;;
        4)
            selected_service="all"
            ;;
        *)
            echo "无效的选项"
            exit 1
            ;;
    esac
}

# 交互式选择服务
interactive_select_service

# 选择操作
echo ""
echo "请选择操作:"
echo "1) 启动服务"
echo "2) 停止服务"
echo "3) 重启服务"
echo "4) 查看状态"
echo "5) 查看日志"
echo ""
read -p "请输入选项 (1-5): " operation_choice

case "$operation_choice" in
    1)
        if [ "$selected_service" = "all" ]; then
            start_service "$SERVICE_VISUALIZATION"
            start_service "$SERVICE_PROCESS"
            start_service "$SERVICE_ANALYSES"
        else
            start_service "$selected_service"
        fi
        ;;
    2)
        stop_service "$selected_service"
        ;;
    3)
        if [ "$selected_service" = "all" ]; then
            _stop_service_internal "all"
            sleep 2
            start_service "$SERVICE_VISUALIZATION"
            start_service "$SERVICE_PROCESS"
            start_service "$SERVICE_ANALYSES"
        else
            _stop_service_internal "$selected_service"
            sleep 2
            start_service "$selected_service"
        fi
        ;;
    4)
        check_service_status "$selected_service"
        ;;
    5)
        show_logs "$selected_service"
        ;;
    *)
        echo "无效的选项"
        exit 1
        ;;
esac
