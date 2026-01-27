-- Enhanced participant bank with meeting associations

-- Add a manually_retained flag to participant_contacts
ALTER TABLE participant_contacts
ADD COLUMN IF NOT EXISTS manually_retained BOOLEAN DEFAULT FALSE;

-- Create junction table for meeting-participant relationships
CREATE TABLE IF NOT EXISTS meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_contact_id UUID REFERENCES participant_contacts(id) ON DELETE SET NULL,
  participant_name VARCHAR(255) NOT NULL,
  participant_title VARCHAR(255),
  participant_role VARCHAR(255),
  participant_company VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meeting_id, participant_name)
);

-- Enable RLS
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_participants
CREATE POLICY "Users can view their own meeting participants" ON meeting_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own meeting participants" ON meeting_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own meeting participants" ON meeting_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own meeting participants" ON meeting_participants
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM meetings
      WHERE meetings.id = meeting_participants.meeting_id
      AND meetings.user_id = auth.uid()
    )
  );

-- Function to retroactively associate participants with meetings
CREATE OR REPLACE FUNCTION associate_participant_with_past_meetings(
  p_user_id UUID,
  p_participant_name VARCHAR(255),
  p_participant_contact_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  meeting_count INTEGER := 0;
  meeting_record RECORD;
BEGIN
  -- Find all meetings for this user
  FOR meeting_record IN
    SELECT id, results
    FROM meetings
    WHERE user_id = p_user_id
  LOOP
    -- Check if participant name appears in this meeting's results
    IF meeting_record.results::text ILIKE '%' || p_participant_name || '%' THEN
      -- Extract participant data from JSON if possible
      INSERT INTO meeting_participants (
        meeting_id,
        participant_contact_id,
        participant_name,
        participant_title,
        participant_role,
        participant_company
      )
      SELECT
        meeting_record.id,
        p_participant_contact_id,
        participant->>'name',
        participant->>'title',
        participant->>'role',
        participant->>'company'
      FROM jsonb_array_elements(meeting_record.results->'participants') AS participant
      WHERE participant->>'name' = p_participant_name
      ON CONFLICT (meeting_id, participant_name)
      DO UPDATE SET participant_contact_id = EXCLUDED.participant_contact_id;

      meeting_count := meeting_count + 1;
    END IF;
  END LOOP;

  RETURN meeting_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar participant names for merge suggestions
CREATE OR REPLACE FUNCTION find_similar_participants(
  p_user_id UUID,
  p_name VARCHAR(255)
)
RETURNS TABLE(
  contact_id UUID,
  name VARCHAR(255),
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.name,
    similarity(pc.name, p_name) AS similarity_score
  FROM participant_contacts pc
  WHERE pc.user_id = p_user_id
    AND pc.name != p_name
    AND similarity(pc.name, p_name) > 0.3
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to merge participant contacts
CREATE OR REPLACE FUNCTION merge_participant_contacts(
  p_keep_id UUID,
  p_merge_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update all meeting_participants to point to the keeper
  UPDATE meeting_participants
  SET participant_contact_id = p_keep_id
  WHERE participant_contact_id = p_merge_id;

  -- Update usage count
  UPDATE participant_contacts
  SET usage_count = usage_count + (
    SELECT usage_count
    FROM participant_contacts
    WHERE id = p_merge_id AND user_id = p_user_id
  )
  WHERE id = p_keep_id AND user_id = p_user_id;

  -- Delete the merged contact
  DELETE FROM participant_contacts
  WHERE id = p_merge_id AND user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get participant with meetings
CREATE OR REPLACE FUNCTION get_participants_with_meetings(p_user_id UUID)
RETURNS TABLE(
  contact_id UUID,
  name VARCHAR(255),
  title VARCHAR(255),
  role VARCHAR(255),
  company VARCHAR(255),
  email VARCHAR(255),
  manually_retained BOOLEAN,
  meeting_count BIGINT,
  meetings JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.name,
    pc.title,
    pc.role,
    pc.company,
    pc.email,
    pc.manually_retained,
    COUNT(DISTINCT mp.meeting_id) AS meeting_count,
    COALESCE(
      jsonb_agg(
        DISTINCT jsonb_build_object(
          'id', m.id,
          'title', m.title,
          'date', m.meeting_date,
          'summary', m.results->'summary'
        )
      ) FILTER (WHERE m.id IS NOT NULL),
      '[]'::jsonb
    ) AS meetings
  FROM participant_contacts pc
  LEFT JOIN meeting_participants mp ON mp.participant_contact_id = pc.id
  LEFT JOIN meetings m ON m.id = mp.meeting_id
  WHERE pc.user_id = p_user_id
  GROUP BY pc.id, pc.name, pc.title, pc.role, pc.company, pc.email, pc.manually_retained
  ORDER BY meeting_count DESC NULLS LAST, pc.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable pg_trgm extension for similarity matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;