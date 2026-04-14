# Security Hardening Audit Remediation

This document captures the concrete fixes introduced after the April 14, 2026 audit and the remaining application changes that should follow immediately.

## Implemented in this branch

- Added a Supabase migration at `supabase/migrations/20260414093000_security_hardening.sql`.
- Added server-side RPC functions for role updates and role revocation.
- Added QR rotation and QR validation functions so attendance can be validated in the database layer instead of trusting raw client queries.
- Added missing schema fields used by the app: `attendance.geo_lat`, `attendance.geo_lng`, and `sessions.qr_expires_at`.
- Added a unique partial index for session QR codes.
- Added CI for lint, build, and test checks.

## Remaining frontend changes

These changes should be applied in the React app next so the UI actually uses the hardened backend path.

### 1. Protected routes must deny by default

Update `src/components/ProtectedRoute.tsx` so that authenticated users with an unresolved role are redirected instead of being allowed through.

Target behavior:

- `loading === true`: show loader
- `!user`: redirect to `/auth`
- `allowedRoles && !role`: redirect to `/auth`
- `allowedRoles && role not included`: redirect to the correct dashboard
- Only render children when role is valid

### 2. Replace direct table writes for role changes

`src/pages/admin/Users.tsx` should stop deleting/inserting directly into `user_roles`.

Use:

- `supabase.rpc("update_user_role", { _target_user_id: userId, _new_role: role })`
- `supabase.rpc("revoke_user_role", { _target_user_id: userId })`

### 3. Replace raw QR lookups with backend validation

`src/pages/student/Scan.tsx` should stop trusting direct `sessions` lookups and use:

- `supabase.rpc("validate_attendance_qr", { _qr_code: qrCode, _student_user_id: user.id, _geo_lat: geo?.lat ?? null, _geo_lng: geo?.lng ?? null })`

`src/pages/admin/Sessions.tsx` should generate QR values by calling:

- `supabase.rpc("rotate_session_qr", { _session_id: session.id, _expiry_minutes: 1 })`

## Notes

The current repo audit also found that the local terminal session was unavailable from the editing environment used for this branch. Because of that, the hardening work in this branch focuses on backend-enforceable fixes and CI guardrails that could be committed safely through the available GitHub connector path.
