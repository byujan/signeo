-- ============================================================
-- Tighten RLS: drop overly permissive INSERT policies
-- ============================================================

-- These "with check (true)" policies allowed any authenticated user to insert.
-- Not needed: handle_new_user() runs as SECURITY DEFINER, logEvent uses admin client.
DROP POLICY IF EXISTS "service inserts orgs" ON organizations;
DROP POLICY IF EXISTS "service inserts profiles" ON profiles;
DROP POLICY IF EXISTS "service inserts audit" ON audit_events;

-- ============================================================
-- Ensure storage buckets are private
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO UPDATE SET public = false;
INSERT INTO storage.buckets (id, name, public) VALUES ('signatures', 'signatures', false)
  ON CONFLICT (id) DO UPDATE SET public = false;

-- ============================================================
-- Harden OAuth profile creation (handle various metadata fields)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_org_id uuid;
  display_name text;
BEGIN
  display_name := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'user_name', ''),
    nullif(new.raw_user_meta_data->>'preferred_username', ''),
    split_part(new.email, '@', 1)
  );

  INSERT INTO organizations (name) VALUES (
    display_name || '''s Org'
  ) RETURNING id INTO new_org_id;

  INSERT INTO profiles (id, org_id, full_name, email) VALUES (
    new.id,
    new_org_id,
    display_name,
    new.email
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
