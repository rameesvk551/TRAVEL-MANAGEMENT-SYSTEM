import nodemailer from 'nodemailer';

type MailerConfig = {
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
    secure?: boolean;
    from?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getConfig(): MailerConfig {
    return {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
        secure: (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        from: process.env.SMTP_FROM,
    };
}

export function getMailer() {
    if (transporter) return transporter;

    const cfg = getConfig();
    if (!cfg.host) {
        console.warn('[Mailer] SMTP_HOST not set; emails will be skipped.');
        return null;
    }

    transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port || 587,
        secure: cfg.secure,
        auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
    });

    return transporter;
}

export async function sendEmail(to: string, subject: string, html?: string, text?: string) {
    const mailer = getMailer();
    if (!mailer) {
        console.log('[Mailer] Skipping send (no SMTP config).', { to, subject });
        return { skipped: true };
    }

    const from = process.env.SMTP_FROM || 'Marketing OS <no-reply@localhost>';
    await mailer.sendMail({
        from,
        to,
        subject,
        text: text || undefined,
        html: html || text,
    });

    return { sent: true };
}
