CREATE TABLE public.external_api_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL DEFAULT 'custom',
  website_url text NOT NULL,
  encrypted_key text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT external_api_provider_check CHECK (provider IN ('bwild_engine', 'custom'))
);
GRANT ALL ON public.external_api_connections TO service_role;
REVOKE ALL ON public.external_api_connections FROM anon, authenticated;
ALTER TABLE public.external_api_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages encrypted external connections" ON public.external_api_connections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE UNIQUE INDEX external_api_engine_unique ON public.external_api_connections (provider) WHERE provider = 'bwild_engine';
COMMENT ON TABLE public.external_api_connections IS 'Encrypted external credentials. Only admin-authorized server handlers access this table; browser receives metadata only.';