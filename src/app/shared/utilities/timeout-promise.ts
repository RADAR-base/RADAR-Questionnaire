export class TimeoutError extends Error {
  constructor(operation: string, ms: number) {
    super(`Operation "${operation}" timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  operation: string
): Promise<T> {
  let timer: any
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(operation, ms)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export function withTimeoutAndDefault<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
  operation: string
): Promise<T> {
  return withTimeout(promise, ms, operation).catch(e => {
    console.warn(`[TIMEOUT] ${operation} fell back to default:`, e.message || e)
    return fallback
  })
}
