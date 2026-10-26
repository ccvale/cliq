/** Turns a user agent into something a person recognises, like "iPhone · Cliq app" or "Chrome on Windows". */
export function describeDevice(ua: string): string {
  if (!ua) return 'Unknown device';
  const os = /iPhone|iPad/.test(ua) ? (ua.includes('iPad') ? 'iPad' : 'iPhone') : /Android/.test(ua) ? 'Android' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '';
  if (/okhttp|CFNetwork|Expo|Darwin/i.test(ua) && !/Mozilla/.test(ua)) return `${os || 'Phone'} · Cliq app`;
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  return os ? `${browser} on ${os}` : browser;
}
