/**
 * 防抖工具：用于情感分析等高频调用的节流
 * 对话场景用户快速打字/连续发送时，避免每次都触发 ONNX 推理
<<<<<<< HEAD
 *
 * 语义（trailing + shared-latest）：
 * - 每次调用都会得到一个 Promise；窗口期内多次调用共享同一次执行，
 *   执行完成（或失败）后**所有排队调用者**都拿到最后一次调用的结果。
 * - 修复：旧实现窗口内第二次调用会让第一次调用的 Promise 永久 pending
 *   （timer 被替换、resolve 丢失），模块级单例下会导致首个调用方挂死。
=======
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
 */

/**
 * 创建一个防抖函数
 * @param fn 要防抖的异步函数
 * @param wait 等待时间（ms）
 * @returns 防抖后的函数 + cancel 方法
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  wait: number = 500
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
<<<<<<< HEAD
  let lastArgs: any[] | null = null;
  let pending: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

  const debounced = ((...args: any[]) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    return new Promise((resolve, reject) => {
      pending.push({ resolve, reject });
      timer = setTimeout(async () => {
        timer = null;
        const callers = pending.splice(0);
        pending = [];
        const argsForRun = lastArgs;
        lastArgs = null;
        try {
          const result = await fn(...(argsForRun ?? []));
          callers.forEach((c) => c.resolve(result));
        } catch (e) {
          callers.forEach((c) => c.reject(e));
        }
=======
  let pendingArgs: any[] | null = null;

  const debounced = ((...args: any[]) => {
    pendingArgs = args;
    if (timer) clearTimeout(timer);
    return new Promise((resolve, reject) => {
      timer = setTimeout(async () => {
        timer = null;
        if (pendingArgs) {
          try {
            const result = await fn(...pendingArgs);
            resolve(result);
          } catch (e) {
            reject(e);
          }
        }
        pendingArgs = null;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
      }, wait);
    });
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
<<<<<<< HEAD
    lastArgs = null;
    const callers = pending.splice(0);
    pending = [];
    // 取消时让排队调用者尽快失败而非永久挂起
    callers.forEach((c) => c.reject(new Error('debounce canceled')));
=======
    pendingArgs = null;
>>>>>>> a66c30d430cd26eb226e71f7098d31e9a6a7c193
  };

  return debounced;
}
