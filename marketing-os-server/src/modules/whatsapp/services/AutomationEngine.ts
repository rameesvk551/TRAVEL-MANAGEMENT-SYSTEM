// application/services/whatsapp/AutomationEngine.ts

import { v4 as uuidv4 } from 'uuid';

export function createAutomationEngine(messageService: any, conversationService: any) {
    const rules: Map<string, any[]> = new Map();

    function loadMockRules() {
        const demoRule = {
            id: 'rule_1', tenantId: 'default', name: 'Price Inquiry Auto-reply', isActive: true,
            trigger: { type: 'MESSAGE_RECEIVED' },
            conditions: [{ field: 'message_body', operator: 'contains', value: 'price' }],
            actions: [
                { type: 'SEND_TEXT', config: { text: 'Thanks for your interest! Our packages start at $500. Would you like to see the brochure?' } },
                { type: 'ADD_TAG', config: { tag: 'interested_in_price' } },
            ],
        };
        rules.set('default', [demoRule]);
    }

    loadMockRules();

    function evaluateConditions(rule: any, data: any) {
        return rule.conditions.every((condition: any) => {
            let actualValue = '';
            if (condition.field === 'message_body') actualValue = data.textBody || '';
            if (condition.field === 'sender_phone') actualValue = data.senderPhone || '';
            if (!actualValue) return false;
            switch (condition.operator) {
                case 'contains': return actualValue.toLowerCase().includes(condition.value.toLowerCase());
                case 'equals': return actualValue.toLowerCase() === condition.value.toLowerCase();
                case 'starts_with': return actualValue.toLowerCase().startsWith(condition.value.toLowerCase());
                default: return false;
            }
        });
    }

    async function executeActions(tenantId: string, rule: any, data: any) {
        for (const action of rule.actions) {
            try {
                switch (action.type) {
                    case 'SEND_TEXT': await messageService.sendText({ tenantId, recipientPhone: data.senderPhone, text: action.config.text, senderUserId: 'AUTOMATION' }); break;
                    case 'SEND_TEMPLATE': await messageService.sendTemplate({ tenantId, recipientPhone: data.senderPhone, templateName: action.config.templateName, language: action.config.language || 'en', variables: action.config.variables || {}, senderUserId: 'AUTOMATION' }); break;
                    case 'ADD_TAG': console.log(`[Automation] Adding tag "${action.config.tag}" to ${data.senderPhone}`); break;
                    case 'ASSIGN_AGENT': console.log(`[Automation] Assigning agent "${action.config.agentId}" to conversation`); break;
                }
            } catch (error) { console.error(`[Automation] Failed to execute action ${action.type} for rule ${rule.name}`, error); }
        }
    }

    async function processEvent(tenantId: string, eventType: string, data: any) {
        const tenantRules = rules.get(tenantId) || [];
        const activeRules = tenantRules.filter(r => r.isActive && r.trigger.type === eventType);
        for (const rule of activeRules) {
            if (evaluateConditions(rule, data)) {
                console.log(`[Automation] Executing rule "${rule.name}" for tenant ${tenantId}`);
                await executeActions(tenantId, rule, data);
            }
        }
    }

    async function getRules(tenantId: string) { return rules.get(tenantId) || []; }

    async function createRule(tenantId: string, ruleData: any) {
        const newRule = { id: uuidv4(), tenantId, createdAt: new Date(), ...ruleData };
        const existing = rules.get(tenantId) || [];
        rules.set(tenantId, [...existing, newRule]);
        return newRule;
    }

    async function updateRule(tenantId: string, ruleId: string, updates: any) {
        const ruleList = rules.get(tenantId) || [];
        const index = ruleList.findIndex(r => r.id === ruleId);
        if (index === -1) return null;
        const updatedRule = { ...ruleList[index], ...updates };
        ruleList[index] = updatedRule;
        rules.set(tenantId, ruleList);
        return updatedRule;
    }

    async function deleteRule(tenantId: string, ruleId: string) {
        const ruleList = rules.get(tenantId) || [];
        const filtered = ruleList.filter(r => r.id !== ruleId);
        if (filtered.length === ruleList.length) return false;
        rules.set(tenantId, filtered);
        return true;
    }

    return { processEvent, getRules, createRule, updateRule, deleteRule };
}
