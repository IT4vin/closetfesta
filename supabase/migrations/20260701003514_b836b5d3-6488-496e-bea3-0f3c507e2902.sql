
-- Restrict clients to admin/manager/staff/cashier roles instead of all authenticated
DROP POLICY IF EXISTS "Authenticated read clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated insert clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated update clients" ON public.clients;

CREATE POLICY "Staff read clients" ON public.clients FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff') OR has_role(auth.uid(),'cashier'));
CREATE POLICY "Staff insert clients" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff') OR has_role(auth.uid(),'cashier'));
CREATE POLICY "Staff update clients" ON public.clients FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'staff'));

-- Profiles: users see only their own; admins/managers see all
DROP POLICY IF EXISTS "Profiles are viewable by authenticated" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'manager'));

-- user_roles: prevent privilege escalation - only service_role can write
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Service role manages roles" ON public.user_roles FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
