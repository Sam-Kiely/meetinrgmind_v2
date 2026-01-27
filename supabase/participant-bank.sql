-- Create participant contacts table for storing user's frequent meeting participants
CREATE TABLE IF NOT EXISTS participant_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  role VARCHAR(255),
  company VARCHAR(255),
  email VARCHAR(255),
  notes TEXT,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name, company)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_participant_contacts_user_id ON participant_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_participant_contacts_name ON participant_contacts(name);

-- Enable RLS
ALTER TABLE participant_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own contacts" ON participant_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON participant_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON participant_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON participant_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Function to upsert participant contact
CREATE OR REPLACE FUNCTION upsert_participant_contact(
  p_user_id UUID,
  p_name VARCHAR(255),
  p_title VARCHAR(255) DEFAULT NULL,
  p_role VARCHAR(255) DEFAULT NULL,
  p_company VARCHAR(255) DEFAULT NULL,
  p_email VARCHAR(255) DEFAULT NULL
)
RETURNS participant_contacts AS $$
DECLARE
  result participant_contacts;
BEGIN
  INSERT INTO participant_contacts (user_id, name, title, role, company, email, usage_count, last_used_at)
  VALUES (p_user_id, p_name, p_title, p_role, p_company, p_email, 1, NOW())
  ON CONFLICT (user_id, name, company)
  DO UPDATE SET
    title = COALESCE(EXCLUDED.title, participant_contacts.title),
    role = COALESCE(EXCLUDED.role, participant_contacts.role),
    email = COALESCE(EXCLUDED.email, participant_contacts.email),
    usage_count = participant_contacts.usage_count + 1,
    last_used_at = NOW(),
    updated_at = NOW()
  RETURNING * INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get frequently used participants for a user
CREATE OR REPLACE FUNCTION get_frequent_participants(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS SETOF participant_contacts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM participant_contacts
  WHERE user_id = p_user_id
  ORDER BY usage_count DESC, last_used_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;