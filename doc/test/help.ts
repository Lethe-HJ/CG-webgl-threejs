const helps: string[] = [];

if ((console as any).help === undefined) {
  (console as any).help = (...args: any[]) => {
    console.info('[命令提示]: ', ...args);
    helps.push(...args);
  };
}

// 扩展 Console 接口类型定义
declare global {
  interface Console {
    help(...args: any[]): void;
  }
  interface Window {
    showHelps: (...args: any[]) => void;
  }
}

const oldShowHelps = window.showHelps;
window.showHelps = () => {
  if (oldShowHelps) oldShowHelps();
  helps.forEach((help) => {
    console.info('[命令提示]: ', help);
  });
};

// 使其成为模块
export {};
