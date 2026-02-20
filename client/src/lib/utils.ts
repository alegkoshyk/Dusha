import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  if (url.startsWith('/api/r2/')) return url;
  if (url.startsWith('/api/media/')) return url;

  if (url.startsWith('https://storage.googleapis.com/')) {
    const withPublicPrivate = url.match(/googleapis\.com\/[^/]+\/(?:public\/|\.private\/)(.+?)(?:\?.*)?$/);
    if (withPublicPrivate) {
      return `/api/media/proxy?key=${encodeURIComponent(withPublicPrivate[1])}`;
    }
    const withoutPrefix = url.match(/googleapis\.com\/[^/]+\/(.+?)(?:\?.*)?$/);
    if (withoutPrefix) {
      return `/api/media/proxy?key=${encodeURIComponent(withoutPrefix[1])}`;
    }
  }

  if (url.includes('/.private/')) {
    const match = url.match(/\.private\/(.+?)(?:\?.*)?$/);
    if (match) {
      return `/api/media/proxy?key=${encodeURIComponent(match[1])}`;
    }
  }

  return url;
}
