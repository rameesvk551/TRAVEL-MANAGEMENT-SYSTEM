-- Fix tenant_id type to match other modules (VARCHAR instead of UUID)

-- whatsapp_conversations
ALTER TABLE whatsapp_conversations DROP CONSTRAINT IF EXISTS whatsapp_conversations_tenant_id_fkey;
ALTER TABLE whatsapp_conversations ALTER COLUMN tenant_id TYPE VARCHAR(100);

-- whatsapp_messages
ALTER TABLE whatsapp_messages DROP CONSTRAINT IF EXISTS whatsapp_messages_tenant_id_fkey;
ALTER TABLE whatsapp_messages ALTER COLUMN tenant_id TYPE VARCHAR(100);

-- whatsapp_templates
ALTER TABLE whatsapp_templates DROP CONSTRAINT IF EXISTS whatsapp_templates_tenant_id_fkey;
ALTER TABLE whatsapp_templates ALTER COLUMN tenant_id TYPE VARCHAR(100);

-- whatsapp_opt_ins
ALTER TABLE whatsapp_opt_ins DROP CONSTRAINT IF EXISTS whatsapp_opt_ins_tenant_id_fkey;
ALTER TABLE whatsapp_opt_ins ALTER COLUMN tenant_id TYPE VARCHAR(100);

-- unified_timeline
ALTER TABLE unified_timeline DROP CONSTRAINT IF EXISTS unified_timeline_tenant_id_fkey;
ALTER TABLE unified_timeline ALTER COLUMN tenant_id TYPE VARCHAR(100);
