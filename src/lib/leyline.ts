/** Typed access to the preload bridge. */
export function hasLeylineBridge(): boolean {
  return typeof window !== 'undefined' && Boolean(window.leyline);
}

export function getLeyline() {
  if (!hasLeylineBridge()) {
    throw new Error('Leyline bridge is unavailable outside Electron');
  }
  return window.leyline;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
