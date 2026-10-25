import { createRemoteJWKSet, jwtVerify } from 'jose';
import { config } from '../config.js';

const appleKeys = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

export type ExternalIdentity = { subject: string; email?: string; emailVerified: boolean };

/** Verifies an identity token minted by Sign in with Apple on the device. */
export async function verifyAppleToken(identityToken: string): Promise<ExternalIdentity> {
  if (!config.appleAudiences.length) throw new Error('Sign in with Apple is not configured');
  const { payload } = await jwtVerify(identityToken, appleKeys, {
    issuer: 'https://appleid.apple.com',
    audience: config.appleAudiences,
  });
  return {
    subject: String(payload.sub),
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
  };
}

/** Verifies a Google ID token from the native Google sign-in flow. */
export async function verifyGoogleToken(idToken: string): Promise<ExternalIdentity> {
  if (!config.googleAudiences.length) throw new Error('Sign in with Google is not configured');
  const { payload } = await jwtVerify(idToken, googleKeys, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: config.googleAudiences,
  });
  return {
    subject: String(payload.sub),
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
  };
}
