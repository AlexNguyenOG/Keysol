const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "keyboard",
  "letmein1",
  "welcome1",
  "admin123",
  "iloveyou",
  "sunshine1",
  "football1",
  "baseball1",
  "trustno1",
  "changeme",
  "keysol123",
]);

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function isValidPassword(password: string): boolean {
  return getPasswordValidationError(password) === null;
}

export function getPasswordValidationError(password: string): string | null {
  if (password.length < 8 || password.length > 128) {
    return "Password must be between 8 and 128 characters.";
  }

  if (!/[a-z]/i.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Password is too common. Choose something harder to guess.";
  }

  return null;
}

export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 1 && trimmed.length <= 80;
}
