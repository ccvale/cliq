import nodemailer from 'nodemailer';
import { config } from '../config.js';

export type Mail = { to: string; subject: string; text: string; html: string };

/** Mail sent in development and tests, newest last. Nothing is kept when SMTP is configured. */
export const outbox: Mail[] = [];

const transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : null;

export async function sendMail(mail: Mail) {
  if (!transport) {
    outbox.push(mail);
    if (outbox.length > 50) outbox.shift();
    if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) console.log(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
    return;
  }
  await transport.sendMail({ from: config.mailFrom, ...mail });
}

export function codeEmail(kind: 'verify' | 'reset', code: string): Omit<Mail, 'to'> {
  const subject = kind === 'verify' ? `${code} is your Cliq code` : `Reset your Cliq password: ${code}`;
  const lead = kind === 'verify' ? 'Confirm your email to start meeting people on Cliq.' : 'Use this code to choose a new password.';
  return {
    subject,
    text: `${lead}\n\nYour code: ${code}\n\nIt expires in 15 minutes. If you didn't ask for this, you can ignore this email.`,
    html: `<div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:420px;margin:auto;padding:32px;color:#17141B">
<p style="font-family:Georgia,serif;font-style:italic;font-size:28px;margin:0 0 24px">cliq<span style="color:#FF6F91">.</span></p>
<p style="font-size:16px;line-height:1.5">${lead}</p>
<p style="font-size:34px;letter-spacing:8px;font-weight:600;margin:24px 0">${code}</p>
<p style="font-size:13px;color:#8A848F">It expires in 15 minutes. If you didn't ask for this, you can ignore this email.</p></div>`,
  };
}
