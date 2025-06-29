export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
  }
  
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://www.customfiller.com'
}