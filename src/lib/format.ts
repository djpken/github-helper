// Small formatting/env helpers shared across content-script feature modules.
// Ports monkey.js:1174-1204 (getHumanReadableSize, systemTime, timeToSeconds, isMobileDevice).

export function getHumanReadableSize(sizeInKB: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const size = sizeInKB * 1024
  const i = Math.floor(Math.log(size) / Math.log(1024))
  return `${(size / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export function systemTime(isoString: string): string {
  return new Date(isoString).toLocaleString()
}

// Parses a duration string like "1h30m" or "90s" into total seconds.
export function timeToSeconds(timeStr: string): number {
  const hours = Number(timeStr.match(/(\d+)h/)?.[1] ?? 0)
  const minutes = Number(timeStr.match(/(\d+)m/)?.[1] ?? 0)
  const seconds = Number(timeStr.match(/(\d+)s/)?.[1] ?? 0)
  return hours * 3600 + minutes * 60 + seconds
}

export function isMobileDevice(): boolean {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}
