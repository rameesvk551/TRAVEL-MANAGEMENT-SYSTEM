-- migrations/hrms/007_update_documents_table.sql
-- Update documents table to match the full EmployeeDocument entity

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add category column if type column exists but category doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'type')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'category')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN category VARCHAR(30);
        -- Migrate data from type to category
        UPDATE hrms.documents SET category = type;
        ALTER TABLE hrms.documents ALTER COLUMN category SET NOT NULL;
    END IF;

    -- Add document_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'document_type')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN document_type VARCHAR(100) DEFAULT 'Other';
    END IF;

    -- Add document_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'document_number')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN document_number VARCHAR(100);
    END IF;

    -- Add file_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'file_name')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN file_name VARCHAR(255);
        -- Default to extracting from file_url or name
        UPDATE hrms.documents SET file_name = name WHERE file_name IS NULL;
    END IF;

    -- Add mime_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'mime_type')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN mime_type VARCHAR(100);
    END IF;

    -- Add status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'status')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN status VARCHAR(20) DEFAULT 'PENDING'
            CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED'));
        -- Migrate from is_verified
        UPDATE hrms.documents SET status = 
            CASE WHEN is_verified = true THEN 'VERIFIED' ELSE 'PENDING' END
            WHERE status = 'PENDING' OR status IS NULL;
    END IF;

    -- Add rejection_reason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'rejection_reason')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN rejection_reason TEXT;
    END IF;

    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'hrms' AND table_name = 'documents' AND column_name = 'notes')
    THEN
        ALTER TABLE hrms.documents ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Add index on status
CREATE INDEX IF NOT EXISTS idx_documents_status ON hrms.documents(status);

-- Add index on category
CREATE INDEX IF NOT EXISTS idx_documents_category ON hrms.documents(category);
