from openai import OpenAI

class OpenAICompatibleClient:
    """
    一个用于调用任何兼容OpenAI接口的LLM服务的客户端。
    """
    def __init__(self, model: str, api_key: str, base_url: str):
        self.model = model
        self._base_url = base_url
        self.client = OpenAI(api_key=api_key, base_url=base_url)

    def generate(self, prompt: str, system_prompt: str) -> str:
        """调用LLM API来生成回应。"""
        print("正在调用大语言模型...")
        try:
            messages = [
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': prompt}
            ]
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=False
            )
            answer = response.choices[0].message.content
            print("大语言模型响应成功。")
            return answer
        except Exception as e:
            err_type = type(e).__name__
            err_msg = str(e)
            print(f"调用LLM API时发生错误: [{err_type}] {err_msg}")
            # 若有 HTTP 响应，输出状态码与详情
            if hasattr(e, "response") and e.response is not None:
                r = e.response
                print(f"  HTTP 状态码: {getattr(r, 'status_code', 'N/A')}")
                if hasattr(r, "url") and r.url:
                    print(f"  请求 URL: {r.url}")
                if hasattr(r, "text") and r.text:
                    print(f"  响应内容: {r.text[:500]}" + ("..." if len(r.text) > 500 else ""))
            print(f"  当前配置: base_url={self._base_url!r}, model={self.model!r}")
            return "错误:调用语言模型服务时出错。"
