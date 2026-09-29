-- ============================================================================
-- ACESSACIDADE - SCHEMA DO BANCO DE DADOS (SUPABASE POSTGRESQL)
-- ============================================================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS E TIPOS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('comum', 'comerciante', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE establishment_status AS ENUM ('pendente', 'verificado', 'rejeitado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE disability_type AS ENUM ('mobilidade', 'visual', 'auditiva', 'intelectual', 'invisivel');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE establishment_category AS ENUM (
        'alimentacao', 
        'saude', 
        'lazer_cultura', 
        'comercio_loja', 
        'servico_publico', 
        'banheiro_adaptado', 
        'educacao', 
        'transporte_mobilidade', 
        'hospedagem'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABELA: USERS
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tipo user_role NOT NULL DEFAULT 'comum',
    preferencias_acessibilidade disability_type[] DEFAULT '{}',
    avatar_url TEXT,
    bio TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA: ESTABLISHMENTS
CREATE TABLE IF NOT EXISTS public.establishments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id TEXT,
    nome TEXT NOT NULL,
    categoria establishment_category NOT NULL,
    endereco TEXT NOT NULL,
    bairro TEXT,
    cidade TEXT NOT NULL,
    estado VARCHAR(2) NOT NULL DEFAULT 'SP',
    cep VARCHAR(10),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    descricao TEXT NOT NULL,
    fotos TEXT[] DEFAULT '{}',
    dono_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    status establishment_status NOT NULL DEFAULT 'pendente',
    telefone TEXT,
    whatsapp TEXT,
    email_contato TEXT,
    horario_funcionamento TEXT,
    website TEXT,
    nota_media NUMERIC(3,2) DEFAULT 5.0,
    total_avaliacoes INTEGER DEFAULT 0,
    motivo_rejeicao TEXT,
    verificado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA: ACCESSIBILITY_CRITERIA
CREATE TABLE IF NOT EXISTS public.accessibility_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    tipo_deficiencia disability_type NOT NULL,
    criterio TEXT NOT NULL,
    presente BOOLEAN DEFAULT NULL,
    recurso TEXT,
    observacao_livre TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA: REVIEWS
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    establishment_id UUID NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_nome TEXT NOT NULL,
    tipo_deficiencia_avaliada disability_type NOT NULL,
    nota INTEGER NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT NOT NULL,
    fotos TEXT[] DEFAULT '{}',
    denunciada BOOLEAN DEFAULT FALSE,
    motivo_denuncia TEXT,
    data TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA: PROFESSIONALS
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    especialidade TEXT NOT NULL,
    registro_profissional TEXT,
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE SET NULL,
    endereco TEXT,
    cidade TEXT NOT NULL,
    estado VARCHAR(2) NOT NULL DEFAULT 'SP',
    telefone TEXT,
    email TEXT,
    whatsapp TEXT,
    atende_por_tipo disability_type[] NOT NULL DEFAULT '{}',
    descricao TEXT,
    foto_url TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA: ROUTES (Rotas Urbanas Acessíveis)
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    cidade TEXT NOT NULL,
    ponto_origem TEXT NOT NULL,
    ponto_destino TEXT NOT NULL,
    trecho_descricao TEXT NOT NULL,
    tem_rampa BOOLEAN NOT NULL DEFAULT true,
    tem_piso_tatil BOOLEAN NOT NULL DEFAULT true,
    tem_semaforo_sonoro BOOLEAN NOT NULL DEFAULT false,
    nivel_seguranca TEXT NOT NULL DEFAULT 'Alto (Calçadas largas e sem desníveis)',
    coordenadas JSONB NOT NULL DEFAULT '[]', -- Array de [lat, lng]
    distancia_metros INTEGER DEFAULT 450,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ÍNDICES DE PERFORMANCE E GEOLOCALIZAÇÃO
CREATE INDEX IF NOT EXISTS idx_establishments_status ON public.establishments(status);
CREATE INDEX IF NOT EXISTS idx_establishments_category ON public.establishments(categoria);
CREATE INDEX IF NOT EXISTS idx_establishments_lat_lng ON public.establishments(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_criteria_establishment ON public.accessibility_criteria(establishment_id);
CREATE INDEX IF NOT EXISTS idx_criteria_tipo ON public.accessibility_criteria(tipo_deficiencia);
CREATE INDEX IF NOT EXISTS idx_reviews_establishment ON public.reviews(establishment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_tipo ON public.reviews(tipo_deficiencia_avaliada);
CREATE INDEX IF NOT EXISTS idx_professionals_types ON public.professionals USING GIN (atende_por_tipo);
CREATE INDEX IF NOT EXISTS idx_users_preferences ON public.users USING GIN (preferencias_acessibilidade);

-- 9. POLÍTICAS ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

-- O papel administrativo deve ser definido em auth.users.raw_app_meta_data.role.
-- Nunca use raw_user_meta_data para autorização: esse campo pode ser editado pelo usuário.

DROP POLICY IF EXISTS "Usuário visualiza o próprio perfil" ON public.users;
CREATE POLICY "Usuário visualiza o próprio perfil"
    ON public.users FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Usuário atualiza o próprio perfil" ON public.users;
CREATE POLICY "Usuário atualiza o próprio perfil"
    ON public.users FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (nome, preferencias_acessibilidade, avatar_url, bio) ON public.users TO authenticated;

DROP POLICY IF EXISTS "Leitura pública de estabelecimentos aprovados" ON public.establishments;
CREATE POLICY "Leitura pública de estabelecimentos aprovados"
    ON public.establishments FOR SELECT TO anon, authenticated
    USING (
      status = 'verificado'
      OR (SELECT auth.uid()) = dono_id
      OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

DROP POLICY IF EXISTS "Comerciante cadastra local pendente" ON public.establishments;
CREATE POLICY "Comerciante cadastra local pendente"
    ON public.establishments FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = dono_id AND status = 'pendente');

DROP POLICY IF EXISTS "Comerciante edita o próprio local pendente" ON public.establishments;
CREATE POLICY "Comerciante edita o próprio local pendente"
    ON public.establishments FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = dono_id AND status IN ('pendente', 'rejeitado'))
    WITH CHECK ((SELECT auth.uid()) = dono_id AND status = 'pendente');

DROP POLICY IF EXISTS "Admin modera estabelecimentos" ON public.establishments;
CREATE POLICY "Admin modera estabelecimentos"
    ON public.establishments FOR UPDATE TO authenticated
    USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Leitura pública de critérios" ON public.accessibility_criteria;
CREATE POLICY "Leitura pública de critérios"
    ON public.accessibility_criteria FOR SELECT TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.establishments e WHERE e.id = establishment_id));

DROP POLICY IF EXISTS "Leitura pública de avaliações" ON public.reviews;
CREATE POLICY "Leitura pública de avaliações"
    ON public.reviews FOR SELECT TO anon, authenticated
    USING (denunciada = false OR (SELECT auth.uid()) = user_id OR (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Usuário publica avaliação própria" ON public.reviews;
CREATE POLICY "Usuário publica avaliação própria"
    ON public.reviews FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admin modera avaliações" ON public.reviews;
CREATE POLICY "Admin modera avaliações"
    ON public.reviews FOR ALL TO authenticated
    USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Leitura pública de profissionais" ON public.professionals;
CREATE POLICY "Leitura pública de profissionais"
    ON public.professionals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de rotas" ON public.routes;
CREATE POLICY "Leitura pública de rotas"
    ON public.routes FOR SELECT USING (true);
