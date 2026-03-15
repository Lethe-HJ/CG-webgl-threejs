import requests

# wttr.in 建议带 User-Agent，且部分环境 HTTPS 易出现 SSL 问题，可回退到 HTTP
HEADERS = {"User-Agent": "curl/7.64.1"}
TIMEOUT = 15


def _fetch(url: str) -> requests.Response:
    return requests.get(url, headers=HEADERS, timeout=TIMEOUT)


def get_weather(city: str) -> str:
    """
    通过调用 wttr.in API 查询真实的天气信息。
    """
    # 先试 HTTPS，若 SSL 失败则回退到 HTTP
    url_https = f"https://wttr.in/{city}?format=j1"
    url_http = f"http://wttr.in/{city}?format=j1"

    try:
        try:
            response = _fetch(url_https)
        except (requests.exceptions.SSLError, requests.exceptions.ConnectionError):
            response = _fetch(url_http)
        response.raise_for_status()
        data = response.json()
        current_condition = data['current_condition'][0]
        weather_desc = current_condition['weatherDesc'][0]['value']
        temp_c = current_condition['temp_C']
        
        # 格式化成自然语言返回
        return f"{city}当前天气:{weather_desc}，气温{temp_c}摄氏度"
        
    except requests.exceptions.RequestException as e:
        # 处理网络错误
        return f"错误:查询天气时遇到网络问题 - {e}"
    except (KeyError, IndexError) as e:
        # 处理数据解析错误
        return f"错误:解析天气数据失败，可能是城市名称无效 - {e}"
