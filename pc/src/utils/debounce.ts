/**
 * 防抖工具：用于情感分析等高频调用的节流
 * 对话场景用户快速打字/连续发送时，避免每次都触发 ONNX 推理
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
      }, wait);
    });
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    pendingArgs = null;
  };

  return debounced;
}
