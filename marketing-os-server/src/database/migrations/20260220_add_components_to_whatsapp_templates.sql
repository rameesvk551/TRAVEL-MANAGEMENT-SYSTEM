-- Add components column to whatsapp_templates

ALTER TABLE whatsapp_templates
ADD COLUMN IF NOT EXISTS components JSONB DEFAULT '[]'::jsonb;
