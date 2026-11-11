CREATE TABLE public.hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.hospital_vitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  revenue numeric NOT NULL DEFAULT 0, returns numeric NOT NULL DEFAULT 0,
  surgeries jsonb NOT NULL DEFAULT '{}', emergency jsonb NOT NULL DEFAULT '{}',
  beds jsonb NOT NULL DEFAULT '{}', attendance jsonb NOT NULL DEFAULT '{}',
  electricity jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, day)
);
CREATE TABLE public.cashbox_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  cash numeric NOT NULL DEFAULT 0, wallets numeric NOT NULL DEFAULT 0, cheques numeric NOT NULL DEFAULT 0,
  insurance numeric NOT NULL DEFAULT 0, deferred numeric NOT NULL DEFAULT 0,
  pledges jsonb NOT NULL DEFAULT '{}',
  match_status text NOT NULL DEFAULT 'pending',
  matched_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, day)
);
CREATE TABLE public.revenue_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  external_ref text,
  kind text NOT NULL, amount numeric NOT NULL, quantity int NOT NULL DEFAULT 1,
  reason text, status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, external_ref)
);
CREATE TABLE public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  external_ref text,
  period text NOT NULL, category text NOT NULL, item text NOT NULL,
  amount numeric NOT NULL, invoice_no text, details jsonb NOT NULL DEFAULT '{}',
  spent_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (hospital_id, external_ref)
);
CREATE TABLE public.expense_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  category text NOT NULL, period text NOT NULL, max_amount numeric NOT NULL,
  UNIQUE (hospital_id, category, period)
);
CREATE TABLE public.staff_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  employee_code text NOT NULL, employee_name text NOT NULL, job_title text,
  day date NOT NULL, shift text NOT NULL DEFAULT 'day',
  check_in timestamptz, check_out timestamptz,
  status text NOT NULL DEFAULT 'present', late_minutes int NOT NULL DEFAULT 0,
  UNIQUE (hospital_id, employee_code, day, shift)
);
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  source text NOT NULL, kind text NOT NULL, sender text,
  body text NOT NULL, is_read boolean NOT NULL DEFAULT false, reply text,
  remind_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['hospitals','hospital_vitals','cashbox_records','revenue_returns','expenses','expense_limits','staff_attendance','notifications'] LOOP
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('CREATE POLICY "signed-in read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
END LOOP; END $$;

INSERT INTO public.hospitals (code, name) VALUES
 ('H1','المستشفى الأول'),('H2','المستشفى الثاني'),('H3','المستشفى الثالث');