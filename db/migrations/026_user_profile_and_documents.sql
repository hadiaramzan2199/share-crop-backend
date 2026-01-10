-- 1. Create the user_documents table as requested
CREATE TABLE IF NOT EXISTS user_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text, -- e.g., 'resume', 'id_proof', 'other'
    uploaded_at timestamptz DEFAULT now()
);

-- index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);

-- 2. Add profile_image_url to users table for easy access
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
