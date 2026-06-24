export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  emailVerified: boolean;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

export type SessionUser = PublicUser;

export type AuthTokenType = "verify_email" | "reset_password";
