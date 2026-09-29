-- Incremental upgrade after supabase_schema.sql. Does not insert demonstration data.
begin;

alter table public.establishments add column if not exists place_id text;
create unique index if not exists establishments_place_id_unique
  on public.establishments (place_id) where place_id is not null;

alter table public.accessibility_criteria alter column presente drop not null;
alter table public.accessibility_criteria alter column presente set default null;
alter table public.accessibility_criteria add column if not exists recurso text;

alter table public.establishments enable row level security;
alter table public.accessibility_criteria enable row level security;
drop policy if exists "Leitura pública de critérios" on public.accessibility_criteria;
create policy "Leitura pública de critérios" on public.accessibility_criteria
  for select to anon, authenticated
  using (exists (select 1 from public.establishments e where e.id = establishment_id));

-- NULL = desconhecido, TRUE = sim, FALSE = nao. Existing explicit values are retained.
-- Uses invoker permissions and existing establishment visibility policies.
create or replace function public.get_place_accessibility(requested_place_id text)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((
    select jsonb_build_object(
      'encontrado', true,
      'verificado', e.status = 'verificado',
      'local', to_jsonb(e) || jsonb_build_object('criteria', coalesce((
        select jsonb_agg(to_jsonb(c) order by c.criado_em, c.id)
        from public.accessibility_criteria c where c.establishment_id = e.id
      ), '[]'::jsonb))
    )
    from public.establishments e
    where e.place_id = requested_place_id and e.status <> 'rejeitado'
  ), jsonb_build_object('encontrado', false, 'verificado', false, 'local', null));
$$;

revoke all on function public.get_place_accessibility(text) from public;
grant execute on function public.get_place_accessibility(text) to anon, authenticated;
grant select on public.establishments, public.accessibility_criteria to anon, authenticated;

commit;
