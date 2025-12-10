const PROTECTED_PATHS = [
  "next.config.js",
  "package.json",
  ".github/",
  "public/branding/",
];

export function isProtectedPath(path: string): boolean {
  return PROTECTED_PATHS.some(p => path === p || path.startsWith(p));
}