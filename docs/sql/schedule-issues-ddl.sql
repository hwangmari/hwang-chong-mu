-- 이슈 트래킹 테이블
CREATE TABLE IF NOT EXISTS schedule_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('blocker', 'warning', 'normal')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- RLS 비활성화 (개인 프로젝트)
ALTER TABLE schedule_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to schedule_issues"
  ON schedule_issues FOR ALL
  USING (true)
  WITH CHECK (true);
