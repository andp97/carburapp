import nodemailer from 'nodemailer';

const port = Number(process.env.SMTP_PORT ?? 1025);
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'localhost',
  port,
  secure: port === 465,
  auth:
    process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@carburapp.local',
    to,
    subject: 'Reimposta la tua password — CarburApp',
    text: `Hai richiesto il reset della password.\n\nClicca il link per impostare una nuova password (valido per 1 ora):\n\n${resetUrl}\n\nSe non hai richiesto il reset, ignora questa email.`,
    html: `<p>Hai richiesto il reset della password.</p><p><a href="${resetUrl}">Reimposta la password</a> (link valido per 1 ora)</p><p>Se non hai richiesto il reset, ignora questa email.</p>`,
  });
}
