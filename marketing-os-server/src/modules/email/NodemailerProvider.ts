import nodemailer from 'nodemailer';
import { decrypt } from '../../shared/utils/encryption.js';

interface EmailMessage {
    to: string;
    subject: string;
    html?: string;
    text?: string;
    fromName: string;
    fromEmail: string;
}

interface IEmailProvider {
    sendEmail(message: EmailMessage, connectionSettings: any): Promise<void>;
    verifyConnection(connectionSettings: any): Promise<boolean>;
}

export class NodemailerProvider implements IEmailProvider {

    private createTransporter(settings: any) {
        let password = settings.encryptedPassword;
        if (settings.encryptedPassword) {
            try {
                password = decrypt(settings.encryptedPassword);
            } catch (error) {
                console.error('Failed to decrypt SMTP password:', error);
                throw new Error('Invalid SMTP credentials configuration');
            }
        }

        return nodemailer.createTransport({
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: settings.smtpPort === 465, // true for 465, false for other ports
            auth: {
                user: settings.username,
                pass: password,
            },
        });
    }

    async sendEmail(message: EmailMessage, connectionSettings: any): Promise<void> {
        const transporter = this.createTransporter(connectionSettings);

        const mailOptions = {
            from: `"${message.fromName}" <${message.fromEmail}>`,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
        };

        try {
            await transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    async verifyConnection(connectionSettings: any): Promise<boolean> {
        const transporter = this.createTransporter(connectionSettings);
        try {
            await transporter.verify();
            return true;
        } catch (error) {
            console.error('SMTP Connection verification failed:', error);
            return false;
        }
    }
}
