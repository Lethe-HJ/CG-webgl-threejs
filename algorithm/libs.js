// 性能测试函数
async function measurePerformance(callback, iterations = 10) {
  let min = {
    time: Infinity,
    res: undefined,
  };
  const progress = SimulateProgress.create(iterations);
  for (let i = 0; i < iterations; i++) {
    const start = performance.now(); // 开始时间
    const res = await callback();
    const end = performance.now(); // 结束时间
    const duration = end - start; // 计算耗时
    if (duration < min.time) {
      min.time = duration; // 更新最小时间
      min.res = res;
    }
    // process.stdout.write(`${(i / iterations).toFixed(2) * 100}%\r`);
    progress.value++;
    await delay(10);
  }
  process.stdout.write(`结果: ${min.res}\n`);
  process.stdout.write(`执行次数: ${iterations}\n`);
  process.stdout.write(`最短耗时: ${min.time.toFixed(4)} ms\n`);
  return min;
}

class SimulateProgress {
  static create(total) {
    return new SimulateProgress(total);
  }

  _value = 0;
  total = 0;
  progress = 0;

  constructor(total) {
    this.total = total;
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.update();
  }

  update() {
    const progress = Math.ceil((this.value / this.total) * 100);
    if (this.value === 1) {
      process.stdout.write("");
    } else if (this.value === 2) {
      process.stdout.write("0%|█");
    } else if (progress > this.progress && progress % 2 == 1) {
      process.stdout.write("█");
    } else if (this.value === this.total - 1) {
      process.stdout.write(`|100%`);
    }
    this.progress = progress;
    if (progress >= 100) {
      process.stdout.write("\n");
    }
  }
}

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

module.exports = {
  measurePerformance,
};
