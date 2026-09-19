export function isMetadata(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && JSON.stringify(value).length <= 8192;
}
