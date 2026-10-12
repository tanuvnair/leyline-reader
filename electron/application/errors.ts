/** Redact cookie/token patterns from errors before they cross the IPC boundary. */
export function redactError(error: unknown): Error {
  const message = error instanceof Error ? error.message : 'Unknown error';
  const redacted = message
    .replace(/(ltoken|cookie_token|ltmid|ltuid)[_v0-9]*=\S+/gi, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, '[REDACTED]');
  return new Error(redacted);
}
