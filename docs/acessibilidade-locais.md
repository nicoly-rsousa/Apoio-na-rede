# Consulta de acessibilidade de locais

## Arquitetura e fluxo

O frontend React + TypeScript + Vite já tinha Google Maps, busca complementar de endereços, filtros, geolocalização, rotas de pedestres e `StorageService` com localStorage. Há um schema Supabase, mas não havia conexão configurada nem backend HTTP próprio. A implementação mantém essa estrutura e separa os serviços novos.

Google Places encontra lugares reais em Cataguases. Cada categoria recebe cor e ícone próprios. Selecionar um lugar consulta seu `place_id` exato no banco configurado ou, sem Supabase, no armazenamento local. Nunca há associação por semelhança de nomes. O painel diferencia carregamento, falha, ausência de cadastro e os recursos Sim, Não e Não verificado. Como chegar calcula um trajeto de pedestres até locais externos, cadastros ou endereços.

No cadastro, Buscar este local no Google Maps vincula identificador, nome, endereço e coordenadas. Os recursos começam desconhecidos e preservam as respostas negativas. Novos cadastros continuam locais e pendentes de revisão. Cadastro encontrado e cadastro revisado são situações distintas.

## Arquivos criados

- `src/data/mapCategories.ts`: categorias, cores, ícones e tipos do Google.
- `src/data/accessibilityResources.ts`: códigos de recursos e compatibilidade com critérios antigos.
- `src/services/placesService.ts`: busca textual e locais próximos.
- `src/services/accessibilityService.ts`: consulta por identificador, local ou remota.
- `src/services/routeService.ts` e `src/utils/formatDistance.ts`: rotas, validação e distâncias.
- `src/lib/supabase.ts`: cliente remoto opcional, inicializado sob demanda.
- `src/components/accessibility/AccessibilitySummary.tsx`: recursos e três estados.
- `src/components/establishments/PlaceAccessibilityPanel.tsx`: consulta e botão de rota.
- `src/components/maps/MapLegend.tsx`: legenda interativa.
- `database/place_accessibility.sql`: atualização incremental e RPC.
- `tests/accessibility.test.mjs`: semântica de recursos e validação de rotas.
- Este documento.

## Arquivos alterados

`ExplorerView.tsx`, `MerchantRegisterWizard.tsx`, `GoogleMap.tsx`, `AccessibilityChecklist.tsx`, `storageService.ts`, `types/index.ts`, `supabase_schema.sql`, `.env.example`, `package.json` e `README.md`.

## Banco e endpoint

Execute `database/place_accessibility.sql` após o schema existente. O script é reaplicável e não insere dados de demonstração.

- `establishments.place_id`: texto opcional, com índice único parcial para valores não nulos.
- `accessibility_criteria.presente`: aceita `NULL` e usa esse padrão. `true` = Sim, `false` = Não, `NULL` = desconhecido. Valores existentes são preservados.
- `accessibility_criteria.recurso`: código opcional do recurso, reaproveitando a tabela atual.
- `get_place_accessibility(requested_place_id text)`: função SQL `SECURITY INVOKER`, sujeita a RLS. Critérios só podem ser lidos quando o estabelecimento correspondente está visível ao solicitante.
- Endpoint: `POST /rest/v1/rpc/get_place_accessibility`, corpo `{ "requested_place_id": "PLACE_ID" }`.
- Resposta: `{ encontrado, verificado, local }`, com os critérios em `local.criteria` e data de revisão em `local.verificado_em`. Sem registro visível: `{ encontrado: false, verificado: false, local: null }`.

Um cadastro pendente invisível por RLS não aparece na consulta pública. Critérios vazios ou apenas nulos não significam ausência de acessibilidade. Não foi criado servidor paralelo nem endpoint `/api` no Vite; o endpoint remoto pertence à Data API do Supabase.

O SQL foi testado em PostgreSQL temporário via PGlite: reaplicação, identidade exata, índice único, true/false/null, registro ausente e RLS. Nenhum projeto remoto foi alterado; a aplicação depende de identificar/configurar o Supabase deste app.

## Variáveis de ambiente

| Variável | Finalidade |
| --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps e Places; chave de demonstração já testada. |
| `VITE_GOOGLE_MAPS_MAP_ID` | `DEMO_MAP_ID` no protótipo. |
| `VITE_SUPABASE_URL` | Opcional; URL do banco remoto. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Opcional; chave pública do mesmo projeto. |

O exemplo não contém chaves reais; `.env.local` permanece ignorado pelo Git. Faturamento não foi ativado e projetos remotos não foram criados ou restaurados.

## Como testar

1. Abra o mapa e alterne categorias na legenda. Confira cores e ícones.
2. Pesquise um restaurante, escola ou farmácia real e selecione uma sugestão do Google. Confira o painel; sem cadastro, os oito recursos devem estar Não verificado.
3. Em Cadastrar Local, pesquise e selecione um lugar do Google. Marque um recurso Sim, outro Não e deixe outro Não verificado. Salve e procure novamente o mesmo local; ele deve continuar pendente de revisão.
4. Use Como chegar, permita localização e confira traçado, distância e aviso de percurso não auditado. Negue a permissão em outra sessão para testar o erro.
5. Pesquise uma rua/CEP e use o botão de rota do endereço.
6. Confira a lista e a navegação por teclado nos pinos. Em tela estreita, confira o painel abaixo do mapa e a legenda com quebra de linha.
7. Com Supabase configurado e SQL aplicado, consulte um `place_id` conhecido. Uma falha de conexão deve aparecer como erro de consulta, nunca como falta de acessibilidade.

Testes automatizados: `npm test`, `npm run lint`, `npm run build`. Os testes usam Node 22.18 ou superior.

## Limitações e próximos passos

- Acessibilidade avaliada é a do estabelecimento. O trajeto não evita automaticamente escadas, obstáculos ou inclinações.
- Busca e locais próximos ficam na região de Cataguases, com até 20 resultados por consulta do Google. Não constituem levantamento completo da cidade.
- A categoria de banheiros não garante adaptação; a legenda explicita essa pendência.
- Filtros de necessidades e Somente verificados exibem os cadastros locais correspondentes; locais externos sem confirmação não aparecem como compatíveis.
- Novos cadastros ficam neste navegador. Ativar consulta remota não envia registros locais ao Supabase. Carregamento remoto do catálogo inteiro, publicação autenticada e moderação são próximos passos.
- Critérios legados sem código só são associados aos oito recursos quando o texto coincide exatamente com o modelo existente. Não há inferência por palavras isoladas.
- Novos dados de exemplo só são inicializados em desenvolvimento. Build de produção em navegador novo começa sem esses registros.
- Avaliações e datas existentes foram preservadas. Confirmações colaborativas, histórico e auditorias de percurso podem ser acrescentados usando os identificadores existentes.
