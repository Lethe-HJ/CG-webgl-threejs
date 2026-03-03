import os
import re
import sys
import importlib
import importlib.util

from llm.openai import OpenAICompatibleClient
from tools.weather import get_weather
from tools.attractions import get_attraction

# 必须存在 config.local.py，否则报错退出
_config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.local.py")
if not os.path.isfile(_config_path):
    print("错误: 未找到 config.local.py。请复制 config.example.py 为 config.local.py 并填写配置。", file=sys.stderr)
    sys.exit(1)
_spec = importlib.util.spec_from_file_location("config_local", _config_path)
_config = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_config)

API_KEY = _config.API_KEY
BASE_URL = _config.BASE_URL
MODEL_ID = _config.MODEL_ID
TAVILY_API_KEY = _config.TAVILY_API_KEY

_prompt = importlib.import_module("prompt.1")
AGENT_SYSTEM_PROMPT = _prompt.AGENT_SYSTEM_PROMPT

available_tools = {
    "get_weather": get_weather,
    "get_attraction": get_attraction,
}

os.environ.setdefault("TAVILY_API_KEY", TAVILY_API_KEY)

# --- 1. 配置LLM客户端 ---
llm = OpenAICompatibleClient(
    model=MODEL_ID,
    api_key=API_KEY,
    base_url=BASE_URL
)

# --- 2. 初始化 ---
user_prompt = "你好，请帮我查询一下2026年5月1号新疆伊犁的天气，然后根据天气推荐一个合适的旅游景点。"
prompt_history = [f"用户请求: {user_prompt}"]

print(f"用户输入: {user_prompt}\n" + "="*40)

# --- 3. 运行主循环 ---
for i in range(5): # 设置最大循环次数
    print(f"--- 循环 {i+1} ---\n")
    
    # 3.1. 构建Prompt
    full_prompt = "\n".join(prompt_history)
    
    # 3.2. 调用LLM进行思考
    llm_output = llm.generate(full_prompt, system_prompt=AGENT_SYSTEM_PROMPT)
    if llm_output.strip().startswith("错误:"):
        print(f"LLM 调用失败: {llm_output.strip()}\n请检查 config.local.py 中的 API_KEY、BASE_URL、MODEL_ID 及网络连接。")
        break
    # 模型可能会输出多余的Thought-Action，需要截断
    match = re.search(r'(Thought:.*?Action:.*?)(?=\n\s*(?:Thought:|Action:|Observation:)|\Z)', llm_output, re.DOTALL)
    if match:
        truncated = match.group(1).strip()
        if truncated != llm_output.strip():
            llm_output = truncated
            print("已截断多余的 Thought-Action 对")
    print(f"模型输出:\n{llm_output}\n")
    prompt_history.append(llm_output)
    
    # 3.3. 解析并执行行动
    action_match = re.search(r"Action: (.*)", llm_output, re.DOTALL)
    if not action_match:
        observation = "错误: 未能解析到 Action 字段。请确保你的回复严格遵循 'Thought: ... Action: ...' 的格式。"
        observation_str = f"Observation: {observation}"
        print(f"{observation_str}\n" + "="*40)
        prompt_history.append(observation_str)
        continue
    action_str = action_match.group(1).strip()

    if action_str.startswith("Finish"):
        final_answer = re.match(r"Finish\[(.*)\]", action_str).group(1)
        print(f"任务完成，最终答案: {final_answer}")
        break
    
    tool_name = re.search(r"(\w+)\(", action_str).group(1)
    args_str = re.search(r"\((.*)\)", action_str).group(1)
    kwargs = dict(re.findall(r'(\w+)="([^"]*)"', args_str))

    if tool_name in available_tools:
        observation = available_tools[tool_name](**kwargs)
    else:
        observation = f"错误:未定义的工具 '{tool_name}'"

    # 3.4. 记录观察结果
    observation_str = f"Observation: {observation}"
    print(f"{observation_str}\n" + "="*40)
    prompt_history.append(observation_str)
