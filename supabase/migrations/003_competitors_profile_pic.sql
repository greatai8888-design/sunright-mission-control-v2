-- Add profile_pic_url column to competitors table
-- Run this in Supabase SQL Editor

ALTER TABLE competitors ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;

-- Update the competitor_latest view to include profile_pic_url
DROP VIEW IF EXISTS competitor_latest;
CREATE VIEW competitor_latest AS
SELECT 
  c.id,
  c.handle,
  c.name,
  c.platform,
  c.notes,
  c.profile_pic_url,
  cs.followers,
  cs.avg_likes,
  cs.avg_comments,
  cs.posts_per_week,
  cs.engagement_rate,
  cs.last_post_date,
  cs.snapshot_at
FROM competitors c
LEFT JOIN LATERAL (
  SELECT * FROM competitor_snapshots 
  WHERE competitor_id = c.id 
  ORDER BY snapshot_at DESC 
  LIMIT 1
) cs ON TRUE;

-- Grant access
GRANT SELECT ON competitor_latest TO anon, authenticated;

COMMENT ON COLUMN competitors.profile_pic_url IS 'Instagram profile picture URL, populated by Iris scraper';
