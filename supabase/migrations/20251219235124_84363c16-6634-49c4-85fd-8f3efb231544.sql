-- Add length constraints and validation to contact_messages table
ALTER TABLE public.contact_messages 
  ALTER COLUMN name TYPE VARCHAR(100),
  ALTER COLUMN email TYPE VARCHAR(255),
  ALTER COLUMN phone TYPE VARCHAR(20),
  ALTER COLUMN message TYPE VARCHAR(5000),
  ALTER COLUMN status TYPE VARCHAR(20);

-- Add validation constraints
ALTER TABLE public.contact_messages
  ADD CONSTRAINT contact_name_not_empty CHECK (trim(name) <> ''),
  ADD CONSTRAINT contact_message_not_empty CHECK (trim(message) <> ''),
  ADD CONSTRAINT contact_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$');

-- Also add constraints to job_applications table for consistency
ALTER TABLE public.job_applications
  ALTER COLUMN name TYPE VARCHAR(100),
  ALTER COLUMN email TYPE VARCHAR(255),
  ALTER COLUMN phone TYPE VARCHAR(20),
  ALTER COLUMN position TYPE VARCHAR(100),
  ALTER COLUMN message TYPE VARCHAR(5000),
  ALTER COLUMN status TYPE VARCHAR(20);

-- Add validation constraints to job_applications
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_name_not_empty CHECK (trim(name) <> ''),
  ADD CONSTRAINT job_email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
  ADD CONSTRAINT job_phone_not_empty CHECK (trim(phone) <> '');