-- Add action_items column to meetings table if it doesn't exist
ALTER TABLE public.meetings
ADD COLUMN IF NOT EXISTS action_items JSONB DEFAULT '[]'::jsonb;

-- Update existing meetings to populate action_items from results.actionItems
UPDATE public.meetings
SET action_items =
  CASE
    WHEN results->'actionItems' IS NOT NULL
    THEN results->'actionItems'
    ELSE '[]'::jsonb
  END
WHERE action_items IS NULL OR action_items = '[]'::jsonb;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_meetings_action_items ON public.meetings USING gin(action_items);

-- Ensure updated_at trigger exists for meetings
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_meetings_updated ON public.meetings;
CREATE TRIGGER on_meetings_updated
    BEFORE UPDATE ON public.meetings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();