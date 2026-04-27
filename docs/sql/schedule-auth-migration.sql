-- ============================================================
-- 업무 캘린더 인증·권한 재정비 마이그레이션
-- 기존 schedule-workspace-ddl.sql 뒤에 실행
-- Supabase SQL Editor에서 실행
-- ============================================================

-- ------------------------------------------------------------
-- 1. 비밀번호 해시 컬럼 추가 (bcrypt/scrypt 해시 저장)
--    기존 평문 password 컬럼은 마이그레이션 후 DROP 예정.
--    NOT NULL 제약을 풀어줘야 새 경로가 password 없이 insert 가능.
-- ------------------------------------------------------------
ALTER TABLE schedule_users
  ADD COLUMN IF NOT EXISTS password_hash text;

ALTER TABLE schedule_workspaces
  ADD COLUMN IF NOT EXISTS password_hash text;

ALTER TABLE schedule_users
  ALTER COLUMN password DROP NOT NULL;

ALTER TABLE schedule_workspaces
  ALTER COLUMN password DROP NOT NULL;

-- ------------------------------------------------------------
-- 2. 워크스페이스 멤버 조인 테이블 신설
--    member_ids text[] 배열을 대체. role 구분 및 가입 시각 보존.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_workspace_members (
  workspace_id text NOT NULL REFERENCES schedule_workspaces(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES schedule_users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'member')),
  invited_by text REFERENCES schedule_users(id),
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_schedule_workspace_members_user
  ON schedule_workspace_members(user_id);

-- ------------------------------------------------------------
-- 3. 초대코드 강화 대비: 만료시각과 1회성 플래그 추가
--    기존 invite_code 컬럼은 유지하되 선택적 TTL/once 지원
-- ------------------------------------------------------------
ALTER TABLE schedule_workspaces
  ADD COLUMN IF NOT EXISTS invite_code_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_code_single_use boolean DEFAULT false;

-- ------------------------------------------------------------
-- 4. 기존 member_ids 배열 → 멤버 테이블 백필
--    owner_user_id는 'owner', 나머지는 'member'
-- ------------------------------------------------------------
INSERT INTO schedule_workspace_members (workspace_id, user_id, role, joined_at)
SELECT
  w.id,
  unnested.user_id,
  CASE WHEN unnested.user_id = w.owner_user_id THEN 'owner' ELSE 'member' END,
  w.created_at
FROM schedule_workspaces w
CROSS JOIN LATERAL unnest(COALESCE(w.member_ids, '{}'::text[])) AS unnested(user_id)
ON CONFLICT (workspace_id, user_id) DO NOTHING;

-- owner_user_id는 있는데 member_ids에 누락된 경우 보강
INSERT INTO schedule_workspace_members (workspace_id, user_id, role, joined_at)
SELECT w.id, w.owner_user_id, 'owner', w.created_at
FROM schedule_workspaces w
WHERE w.owner_user_id IS NOT NULL
ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = 'owner';

-- ------------------------------------------------------------
-- 5. RLS 재작성: default deny (service_role 키로만 접근 가능)
--    기존 "Allow all" 정책 제거 후 null 정책만 남겨 둠.
--    서버 API 라우트에서 service_role 키로 우회한다.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all" ON schedule_users;
DROP POLICY IF EXISTS "Allow all" ON schedule_workspaces;
DROP POLICY IF EXISTS "Allow all" ON schedule_boards;
DROP POLICY IF EXISTS "Allow all" ON schedule_services;
DROP POLICY IF EXISTS "Allow all" ON schedule_tasks;

ALTER TABLE schedule_workspace_members ENABLE ROW LEVEL SECURITY;

-- schedule_issues는 기존 DDL에 RLS가 없었을 수 있으므로 명시적으로 활성화
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'schedule_issues') THEN
    EXECUTE 'ALTER TABLE schedule_issues ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Allow all" ON schedule_issues';
  END IF;
END $$;

-- 어떤 정책도 없으면 기본적으로 DENY. anon/authenticated 모두 차단.
-- service_role 키는 RLS를 우회하므로 API 서버 라우트 동작 보장.

-- ------------------------------------------------------------
-- 6. 롤백 대비 안내
-- ------------------------------------------------------------
-- 모든 서버 라우트 이관이 끝나고 안정화되면 아래 정리 실행:
--   ALTER TABLE schedule_users DROP COLUMN password;
--   ALTER TABLE schedule_workspaces DROP COLUMN password;
--   ALTER TABLE schedule_workspaces DROP COLUMN member_ids;
-- 그 전엔 기존 클라이언트와 병행 운영 가능.
