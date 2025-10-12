-- Create the plans table to store subscription options
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- e.g., 'Basic', 'Sovereign'
  price_monthly INT NOT NULL, -- Price in cents or smallest currency unit
  storage_quota_gb INT NOT NULL,
  max_attachment_size_mb INT NOT NULL,
  active BOOLEAN DEFAULT TRUE
);

-- Create the user_profiles table to link users to their plans and track usage
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  storage_used_bytes BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the initial "Basic Plan" into the plans table
INSERT INTO plans (name, price_monthly, storage_quota_gb, max_attachment_size_mb)
VALUES ('Plano Básico', 0, 5, 3);
