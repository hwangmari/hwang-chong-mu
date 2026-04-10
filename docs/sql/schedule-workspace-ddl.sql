-- ============================================================
-- 업무 캘린더 워크스페이스 확장 DDL
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ============================================================
-- 1. schedule_users 테이블 생성
-- ============================================================
CREATE TABLE schedule_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  password text NOT NULL,
  personal_workspace_id text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 2. schedule_workspaces 테이블 생성
-- ============================================================
CREATE TABLE schedule_workspaces (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('personal', 'shared')),
  password text NOT NULL,
  owner_user_id text,
  member_ids text[] DEFAULT '{}',
  invite_code text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- 3. schedule_boards에 workspace_id 컬럼 추가
-- ============================================================
ALTER TABLE schedule_boards
  ADD COLUMN workspace_id text REFERENCES schedule_workspaces(id);

-- ============================================================
-- 4. schedule_services에 멤버 관련 컬럼 추가
-- ============================================================
ALTER TABLE schedule_services
  ADD COLUMN member_id text,
  ADD COLUMN member_name text,
  ADD COLUMN member_color text;

-- ============================================================
-- 5. 인덱스 추가 (조회 성능)
-- ============================================================
CREATE INDEX idx_schedule_boards_workspace_id
  ON schedule_boards(workspace_id);

CREATE INDEX idx_schedule_services_member_id
  ON schedule_services(member_id);

CREATE INDEX idx_schedule_workspaces_invite_code
  ON schedule_workspaces(invite_code);

-- ============================================================
-- 6. RLS 활성화 + 전체 허용 Policy
-- ============================================================

-- schedule_users
ALTER TABLE schedule_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON schedule_users
  FOR ALL USING (true) WITH CHECK (true);

-- schedule_workspaces
ALTER TABLE schedule_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON schedule_workspaces
  FOR ALL USING (true) WITH CHECK (true);

-- 기존 테이블도 RLS 미설정 시 활성화
-- (이미 RLS가 활성화되어 있다면 아래는 무시됨)
DO $$
BEGIN
  -- schedule_boards
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'schedule_boards'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE schedule_boards ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow all" ON schedule_boards
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- schedule_services
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'schedule_services'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE schedule_services ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow all" ON schedule_services
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  -- schedule_tasks
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'schedule_tasks'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE schedule_tasks ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow all" ON schedule_tasks
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
