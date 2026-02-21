// presentation/middleware/whatsapp/signatureValidation.ts
import crypto from 'crypto';
import { getConfig } from '../../../config/index.js';

export function validateMetaSignature(req: any, res: any, next: any) {
    const config = getConfig();
    const appSecret = config.whatsapp?.appSecret;
    if (!appSecret) {
        console.warn('WhatsApp app secret not configured - skipping signature validation');
        next();
        return;
    }
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        console.warn('Missing X-Hub-Signature-256 header');
        res.status(401).json({ error: 'Missing signature' });
        return;
    }
    const rawBody = req.rawBody;
    if (!rawBody) {
        console.error('Raw body not available for signature validation');
        res.status(500).json({ error: 'Server configuration error' });
        return;
    }
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', appSecret)
        .update(rawBody)
        .digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    if (!isValid) {
        console.warn('Invalid webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
    }
    next();
}

export function captureRawBody(req: any, _res: any, buf: Buffer, encoding: string) {
    req.rawBody = buf.toString((encoding as BufferEncoding) || 'utf8');
}

export function validateWebhookSignature(providerType: string) {
    return (req: any, res: any, next: any) => {
        switch (providerType) {
            case 'meta': validateMetaSignature(req, res, next); break;
            case 'twilio': next(); break;
            case 'vonage': next(); break;
            default: next();
        }
    };
}

export function verifyWebhookChallenge(req: any, res: any, next: any) {
    const config = getConfig();
    const verifyToken = config.whatsapp?.verifyToken;
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('Webhook verified successfully');
            res.status(200).send(challenge);
            return;
        }
        console.warn('Webhook verification failed');
        res.status(403).send('Verification failed');
        return;
    }
    next();
}
