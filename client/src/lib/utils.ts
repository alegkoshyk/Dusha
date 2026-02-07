import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.includes('/.private/')) {
    const match = url.match(/\.private\/(.+)$/);
    if (match) {
      return `/api/media/proxy?key=${encodeURIComponent(match[1])}`;
    }
  }
  return url;
}
