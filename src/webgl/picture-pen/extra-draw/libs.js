// glsl Add a comment to the exported function or make it unexported
export function glsl(strings, ...values) {
  // 合并模板字符串和值
  let str = "";
  for (let i = 0; i < strings.length; i++) {
    str += strings[i] + (values[i] || "");
  }

  // 移除空行
  return str
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n");
}
