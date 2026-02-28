// presentation/middleware/whatsapp/optInValidation.ts

export function validateOptIn(optInRepo: any) {
    return async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { to, phone, recipient, recipientPhone } = req.body;
            const phoneNumber = to || phone || recipient || recipientPhone;
            if (!tenantId) { res.status(401).json({ error: 'Tenant required' }); return; }
            if (!phoneNumber) { res.status(400).json({ error: 'Phone number required' }); return; }
            const optIn = await optInRepo.findByPhone(phoneNumber, tenantId);
            if (!optIn) { res.status(403).json({ error: 'No opt-in record', message: 'Recipient has not opted in to receive WhatsApp messages', code: 'NO_OPT_IN' }); return; }
            if (optIn.status !== 'OPTED_IN') { res.status(403).json({ error: 'Not opted in', message: `Recipient has status: ${optIn.status}`, code: 'OPT_IN_INACTIVE', status: optIn.status }); return; }
            const messageType = req.body.type || req.body.category || 'transactional';
            if (messageType === 'marketing' && !optIn.permissions?.marketing) { res.status(403).json({ error: 'Marketing not permitted', message: 'Recipient has not consented to marketing messages', code: 'NO_MARKETING_CONSENT' }); return; }
            req.optIn = optIn;
            next();
        } catch (error) { next(error); }
    };
}

export function softValidateOptIn(optInRepo: any) {
    return async (req: any, res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const { to, phone, recipient, recipientPhone } = req.body;
            const phoneNumber = to || phone || recipient || recipientPhone;
            if (tenantId && phoneNumber) {
                const optIn = await optInRepo.findByPhone(phoneNumber, tenantId);
                if (!optIn || optIn.status !== 'OPTED_IN') {
                    console.warn(`Sending to non-opted-in recipient: ${phoneNumber} (tenant: ${tenantId})`);
                    req.optInWarning = 'Recipient opt-in status not verified';
                } else { req.optIn = optIn; }
            }
            next();
        } catch (error) { console.error('Opt-in check failed:', error); next(); }
    };
}

export function recordImplicitOptIn(optInRepo: any) {
    return async (req: any, _res: any, next: any) => {
        try {
            const tenantId = req.context?.tenantId;
            const phoneNumber = req.body?.from || req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
            if (tenantId && phoneNumber) {
                const existing = await optInRepo.findByPhone(phoneNumber, tenantId);
                if (!existing) {
                    console.log(`Implicit opt-in recorded for: ${phoneNumber}`);
                }
            }
            next();
        } catch (error) { console.error('Failed to record implicit opt-in:', error); next(); }
    };
}
