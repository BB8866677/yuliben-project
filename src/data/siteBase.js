// `import.meta.env` is provided by Vite, not by Node's native test runner.
export const SITE_BASE = typeof import.meta.env === 'undefined' ? '/' : import.meta.env.BASE_URL;
