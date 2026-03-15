type TimerId = number;

enum EnumTimerGroup {
  feature = 'feature',
  group = 'group',
  selection = 'selection',
}

const groupMap = new Map<
  EnumTimerGroup,
  {
    timeOut: Set<TimerId>;
    interval: Set<TimerId>;
  }
>(
  Object.values(EnumTimerGroup).map((group) => [
    group,
    { timeOut: new Set(), interval: new Set() },
  ]),
);

const _setTimeout = window.setTimeout;
window.setTimeout = function (
  handler: TimerHandler,
  delay: number = 0,
  arg: { group?: EnumTimerGroup; [key: string]: any },
  ...args: any[]
): TimerId {
  const _args = [arg, ...args];
  const timer = _setTimeout(handler, delay, ..._args) as TimerId;
  if (arg?.group) {
    const group = groupMap.get(arg.group);
    if (group) {
      group.timeOut.add(timer);
    } else {
      throw new Error(`该group: ${arg.group} 必须要先注册，才能使用`);
    }
  }
  return timer;
} as typeof window.setTimeout;

const _setInterval = window.setInterval;
window.setInterval = function (
  handler: TimerHandler,
  delay: number = 0,
  arg: { group?: EnumTimerGroup; [key: string]: any },
  ...args: any[]
): TimerId {
  const _args = [arg, ...args];
  const timer = _setInterval(handler, delay, ..._args) as TimerId;
  if (arg?.group) {
    const group = groupMap.get(arg.group);
    if (group) {
      group.interval.add(timer);
    } else {
      throw new Error(`该group: ${arg.group} 必须要先注册，才能使用`);
    }
  }
  return timer;
} as typeof window.setInterval;

window.TimerGroup = EnumTimerGroup;

const _clearTimeout = window.clearTimeout;
window.clearTimeout = function (
  timerIdOrTimeGroup: TimerId | EnumTimerGroup | undefined,
) {
  if (timerIdOrTimeGroup === undefined) {
    _clearTimeout(undefined);
    return;
  }
  if (typeof timerIdOrTimeGroup === 'number') {
    _clearTimeout(timerIdOrTimeGroup);
  } else {
    const timers = groupMap.get(timerIdOrTimeGroup);
    if (timers) {
      timers.timeOut.forEach((timer) => {
        _clearTimeout(timer);
      });
    }
  }
} as typeof window.clearTimeout;

const _clearInterval = window.clearInterval;
window.clearInterval = function (
  timerIdOrTimeGroup: TimerId | EnumTimerGroup | undefined,
) {
  if (timerIdOrTimeGroup === undefined) {
    _clearInterval(undefined);
    return;
  }
  if (typeof timerIdOrTimeGroup === 'number') {
    _clearInterval(timerIdOrTimeGroup);
  } else {
    const timers = groupMap.get(timerIdOrTimeGroup);
    if (timers) {
      timers.interval.forEach((timer) => {
        _clearInterval(timer);
      });
    }
  }
} as typeof window.clearInterval;

export { EnumTimerGroup };
