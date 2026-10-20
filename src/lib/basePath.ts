// next/image does not reliably prefix the configured basePath onto `src`
// when images.unoptimized is set (confirmed broken on the deployed site),
// so every raw asset URL under /public needs it added by hand.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`;
}
