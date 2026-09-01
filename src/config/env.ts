try {
  process.loadEnvFile();
} catch {
  // No .env present; falls back to the defaults below (all values here are
  // public demo data, not secrets, so committed defaults are safe).
}

const value = (name: string, fallback: string): string => process.env[name]?.trim() || fallback;

export const config = {
  storeUrl: value('STORE_URL', 'https://teststore.blassacademy.com').replace(/\/+$/, ''),
  apiBaseUrl: value('API_BASE_URL', 'https://dummyjson.com').replace(/\/+$/, ''),
  users: {
    standard: value('STANDARD_USER', 'standard_user'),
    blocked: value('BLOCKED_USER', 'blocked_user'),
    timeout: value('TIMEOUT_USER', 'timeout_user'),
  },
  password: value('STORE_PASSWORD', 'secret_blass_academy'),
} as const;
