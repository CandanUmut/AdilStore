-- Migration 005: Fix user_roles backfill and admin setup
-- Run this in Supabase SQL editor to fix missing user_roles rows
-- ============================================================

-- 1. Backfill user_roles for any existing auth.users who don't have a row
--    (Handles users created before the trigger was active)
INSERT INTO user_roles (user_id, role)
SELECT id, 'user'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Grant admin role to a specific user by email.
--    UNCOMMENT and replace with your actual Google account email:
--
-- UPDATE user_roles
-- SET role = 'admin', updated_at = now()
-- WHERE user_id = (
--   SELECT id FROM auth.users WHERE email = 'your-email@gmail.com' LIMIT 1
-- );
--
-- After running the UPDATE above, you can access /admin/review

-- 3. Verify the result:
-- SELECT au.email, ur.role
-- FROM auth.users au
-- LEFT JOIN user_roles ur ON ur.user_id = au.id
-- ORDER BY ur.role DESC;
