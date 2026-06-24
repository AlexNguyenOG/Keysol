const VERIFY_EMAIL_SUBJECT = "Verify your KeySol account";
const RESET_PASSWORD_SUBJECT = "Reset your KeySol password";

function getBaseUrl(): string {
  return process.env.KEYSOL_BASE_URL ?? "http://localhost:3000";
}

function getFromAddress(): string | null {
  const from = process.env.EMAIL_FROM?.trim();
  return from || null;
}

export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && getFromAddress());
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = getFromAddress();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[auth-email] ${input.subject} -> ${input.to}`);
      console.info(input.html);
    }
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  return response.ok;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const verifyUrl = `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: VERIFY_EMAIL_SUBJECT,
    html: `
      <p>Thanks for joining KeySol.</p>
      <p><a href="${verifyUrl}">Verify your email address</a> to finish setting up your account.</p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
): Promise<boolean> {
  const resetUrl = `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: RESET_PASSWORD_SUBJECT,
    html: `
      <p>We received a request to reset your KeySol password.</p>
      <p><a href="${resetUrl}">Choose a new password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
