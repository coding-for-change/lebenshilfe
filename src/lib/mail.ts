import nodemailer from "nodemailer";
import { Resend } from "resend";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "127.0.0.1",
  port: parseInt(process.env.SMTP_PORT || "1025", 10),
  secure: false, // local mailpit
});

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
}

export async function sendMail({ to, subject, text, html, from }: MailOptions) {
  const sender = from || process.env.EMAIL_FROM || "noreply@lebenshilfe.local";

  if (resend) {
    const { data, error } = await resend.emails.send({
      from: sender,
      to,
      subject,
      text: text || "",
      html: html || text || "",
    });

    if (error) {
      throw new Error(`Resend Error: ${error.message}`);
    }
    return data;
  } else {
    return transporter.sendMail({
      from: sender,
      to,
      subject,
      text,
      html,
    });
  }
}
