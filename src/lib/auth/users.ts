import { randomUUID } from "node:crypto";
import { getAuthDb } from "@/lib/auth/db";
import type { PublicUser, StoredUser } from "@/lib/auth/types";
import { hashPassword } from "@/lib/auth/password";
import {
  getPasswordValidationError,
  isValidEmail,
  isValidName,
  normalizeEmail,
} from "@/lib/auth/validation";

function mapStoredUser(row: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  emailVerified: number | boolean;
}): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    emailVerified: Boolean(row.emailVerified),
  };
}

const USER_SELECT = `
  SELECT
    id,
    email,
    name,
    password_hash AS passwordHash,
    created_at AS createdAt,
    email_verified AS emailVerified
  FROM users
`;

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
  };
}

export function findUserByEmail(email: string): StoredUser | undefined {
  const normalized = normalizeEmail(email);
  const row = getAuthDb()
    .prepare(`${USER_SELECT} WHERE email = ?`)
    .get(normalized) as
    | {
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        createdAt: string;
        emailVerified: number;
      }
    | undefined;

  return row ? mapStoredUser(row) : undefined;
}

export function findUserById(id: string): StoredUser | undefined {
  const row = getAuthDb()
    .prepare(`${USER_SELECT} WHERE id = ?`)
    .get(id) as
    | {
        id: string;
        email: string;
        name: string;
        passwordHash: string;
        createdAt: string;
        emailVerified: number;
      }
    | undefined;

  return row ? mapStoredUser(row) : undefined;
}

export type CreateUserResult =
  | { ok: true; user: PublicUser }
  | { ok: false; error: string };

const SIGNUP_FAILURE_MESSAGE =
  "Unable to create account. Check your details or try logging in.";

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
}): Promise<CreateUserResult> {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  if (!isValidEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!isValidName(name)) {
    return { ok: false, error: "Name must be between 1 and 80 characters." };
  }

  const passwordError = getPasswordValidationError(input.password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return { ok: false, error: SIGNUP_FAILURE_MESSAGE };
  }

  const user: StoredUser = {
    id: randomUUID(),
    email,
    name,
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
    emailVerified: false,
  };

  try {
    getAuthDb()
      .prepare(
        `
        INSERT INTO users (
          id, email, name, password_hash, created_at, email_verified
        )
        VALUES (@id, @email, @name, @passwordHash, @createdAt, 0)
      `,
      )
      .run(user);
  } catch {
    return { ok: false, error: SIGNUP_FAILURE_MESSAGE };
  }

  return { ok: true, user: toPublicUser(user) };
}

export function markEmailVerified(userId: string): void {
  getAuthDb()
    .prepare("UPDATE users SET email_verified = 1 WHERE id = ?")
    .run(userId);
}

export async function updateUserPassword(
  userId: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const passwordError = getPasswordValidationError(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const passwordHash = await hashPassword(password);
  getAuthDb()
    .prepare("UPDATE users SET password_hash = ? WHERE id = ?")
    .run(passwordHash, userId);

  return { ok: true };
}
