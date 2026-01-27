-- Create usage tracking table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extract_count INTEGER DEFAULT 0,
  last_extract_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own usage" ON user_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Service role can access all usage data
CREATE POLICY "Service role can access all usage" ON user_usage
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update usage count
CREATE OR REPLACE FUNCTION increment_user_usage(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER := 0;
BEGIN
  -- Insert or update user usage
  INSERT INTO user_usage (user_id, extract_count, last_extract_date)
  VALUES (user_uuid, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    extract_count = user_usage.extract_count + 1,
    last_extract_date = NOW(),
    updated_at = NOW()
  RETURNING extract_count INTO current_count;

  RETURN current_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has subscription (we'll update this when we add subscription tracking)
CREATE OR REPLACE FUNCTION user_has_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_sub BOOLEAN := FALSE;
BEGIN
  -- For now, check if user has any meetings saved (paid users)
  -- Later we can add proper subscription table
  SELECT EXISTS(
    SELECT 1 FROM meetings
    WHERE user_id = user_uuid
    AND created_at > NOW() - INTERVAL '30 days'
    LIMIT 1
  ) INTO has_sub;

  RETURN has_sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;