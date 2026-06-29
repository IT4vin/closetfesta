
-- ============================================
-- HELPERS
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- App role enum (used for RBAC)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'staff', 'cashier');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- USER ROLES (RBAC)
-- ============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- CLIENTS
-- ============================================
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  document TEXT,
  birth_date DATE,
  address JSONB,
  notes TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;
GRANT ALL ON public.clients TO service_role;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read clients" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update clients" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins delete clients" ON public.clients FOR DELETE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PRODUCT CATEGORIES & PRODUCTS
-- ============================================
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_categories TO authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers write categories" ON public.product_categories FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE,
  barcode TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.product_categories ON DELETE SET NULL,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit TEXT DEFAULT 'un',
  active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update products" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Managers delete products" ON public.products FOR DELETE USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);

CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT,
  is_primary BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read images" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- APPOINTMENTS
-- ============================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  assigned_to UUID REFERENCES auth.users,
  created_by UUID REFERENCES auth.users,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read appointments" ON public.appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write appointments" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_appointments_updated BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_appointments_start ON public.appointments(start_at);

-- ============================================
-- CASH REGISTERS (PDV)
-- ============================================
CREATE TABLE public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by UUID NOT NULL REFERENCES auth.users,
  closed_by UUID REFERENCES auth.users,
  opening_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_amount NUMERIC(12,2),
  expected_amount NUMERIC(12,2),
  difference NUMERIC(12,2),
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_registers TO authenticated;
GRANT ALL ON public.cash_registers TO service_role;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read cash" ON public.cash_registers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write cash" ON public.cash_registers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.cash_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID NOT NULL REFERENCES public.cash_registers ON DELETE CASCADE,
  type TEXT NOT NULL, -- in, out, reinforcement, withdrawal, sale
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  reference_id UUID,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read movements" ON public.cash_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write movements" ON public.cash_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- SALES (PDV)
-- ============================================
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_register_id UUID REFERENCES public.cash_registers,
  client_id UUID REFERENCES public.clients ON DELETE SET NULL,
  cashier_id UUID REFERENCES auth.users,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed', -- completed, canceled, pending
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write sales" ON public.sales FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_sales_created ON public.sales(created_at DESC);

CREATE TABLE public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales ON DELETE CASCADE,
  product_id UUID REFERENCES public.products ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read sale items" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write sale items" ON public.sale_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales ON DELETE CASCADE,
  method TEXT NOT NULL, -- cash, credit, debit, pix, store_credit
  amount NUMERIC(12,2) NOT NULL,
  installments INTEGER DEFAULT 1,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_payments TO authenticated;
GRANT ALL ON public.sale_payments TO service_role;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read payments" ON public.sale_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write payments" ON public.sale_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- INVENTORY MOVEMENTS
-- ============================================
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products ON DELETE CASCADE,
  type TEXT NOT NULL, -- in, out, adjustment, sale, return
  quantity NUMERIC(12,3) NOT NULL,
  reason TEXT,
  reference_id UUID,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read inventory" ON public.inventory_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write inventory" ON public.inventory_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_inventory_product ON public.inventory_movements(product_id);

-- ============================================
-- FINANCIAL TRANSACTIONS
-- ============================================
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- income, expense
  category TEXT,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_method TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, canceled
  reference_id UUID,
  reference_type TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read finance" ON public.financial_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth write finance" ON public.financial_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_finance_updated BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_finance_due ON public.financial_transactions(due_date);

-- ============================================
-- SETTINGS (single-row store of system settings)
-- ============================================
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES auth.users,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth read settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers write settings" ON public.settings FOR ALL USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- ============================================
-- SALE COMPLETION TRIGGER: decrement stock & write inventory movement
-- ============================================
CREATE OR REPLACE FUNCTION public.process_sale_item()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE public.products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;

    INSERT INTO public.inventory_movements (product_id, type, quantity, reason, reference_id)
    VALUES (NEW.product_id, 'sale', NEW.quantity, 'Venda PDV', NEW.sale_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_sale_item_inserted
AFTER INSERT ON public.sale_items
FOR EACH ROW EXECUTE FUNCTION public.process_sale_item();
