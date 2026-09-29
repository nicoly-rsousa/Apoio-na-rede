# Apoio na Rede

## Organização do projeto

Os componentes estão agrupados por responsabilidade em `src/components/`:
`accessibility`, `establishments`, `explore`, `layout` e `maps`. As telas ficam em
`src/views/`, os estilos em `src/styles/` e as funções utilitárias em `src/utils/`.
Consulte a [estrutura do projeto](docs/estrutura-projeto.md) para localizar arquivos
e seguir a mesma organização ao adicionar código.

## Google Maps

O mapa de exploração e o seletor de coordenadas do cadastro usam a Maps JavaScript API, com marcadores de estabelecimentos, informações de acessibilidade, localização e traçados de rotas.

1. Para apresentar o protótipo sem custos, obtenha uma [Maps Demo Key](https://developers.google.com/maps/documentation/javascript/demo-key), que dispensa faturamento e pausa o uso ao atingir o limite diário. Para produção, habilite a **Maps JavaScript API** em um projeto Google Cloud com faturamento ativo e crie uma chave de API.
2. Copie `.env.example` para `.env.local` e preencha `VITE_GOOGLE_MAPS_API_KEY`.
3. Para produção, crie um Map ID do tipo JavaScript e preencha `VITE_GOOGLE_MAPS_MAP_ID`. `DEMO_MAP_ID` serve para desenvolvimento.
4. Para uma chave de produção, habilite Maps JavaScript API e Places API (New). Restrinja a chave por sites (referenciadores HTTP), permitindo os endereços de desenvolvimento e o domínio publicado, e limite seu uso às APIs necessárias. Variáveis `VITE_` ficam visíveis no navegador.
5. Execute `npm install` e `npm run dev`. No deploy, configure essas variáveis antes de executar `npm run build`.

Sem chave, o mapa apresenta uma mensagem de indisponibilidade. Para verificar a integração com uma chave válida, abra a exploração, selecione um estabelecimento, pesquise um endereço, exiba uma rota e teste a seleção de coordenadas no cadastro. Confira também a localização com permissão do navegador e a navegação por teclado nos marcadores.

A busca de estabelecimentos e os lugares próximos usam Google Places. A busca complementar de endereços mantém ViaCEP, Photon e OpenStreetMap; rotas de pedestres usam o serviço existente baseado em OpenStreetMap. As rotas não auditadas continuam tracejadas e não representam certificação de acessibilidade pelo Google.

## Consulta de acessibilidade por local

Selecione uma categoria na legenda, clique em um pino e consulte os recursos do estabelecimento. O botão **Como chegar** calcula um trajeto a partir da localização autorizada no navegador. A busca por nome também encontra lugares reais, e endereços localizados possuem o mesmo botão de rota.

No cadastro, informe o nome e use **Buscar este local no Google Maps** para vincular seu identificador. Cada recurso começa em **Não verificado** e aceita **Sim** ou **Não**. O protótipo salva novos cadastros neste navegador, com revisão pendente. Sem vínculo com o Google, o cadastro manual continua disponível, mas não será associado automaticamente aos resultados externos.

Sem configuração Supabase, a consulta usa o armazenamento local existente. Para consultar um banco remoto, execute `database/place_accessibility.sql` após o schema base e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. O endpoint é `POST /rest/v1/rpc/get_place_accessibility`, com corpo `{ "requested_place_id": "IDENTIFICADOR_DO_GOOGLE" }`. Ele respeita RLS e retorna `encontrado`, `verificado` e `local` (com `criteria`). Não use chaves secretas ou `service_role` no frontend.

O modo Supabase consulta os registros do banco, sem gravar automaticamente os cadastros locais nele. O fluxo autenticado de publicação/moderação remota ainda precisa ser integrado. Não foi alterado nenhum projeto Supabase remoto nesta implementação.

Validação: `npm test` (Node 22.18+), `npm run lint` e `npm run build`. Veja [detalhes da implementação e roteiro de teste](docs/acessibilidade-locais.md).

Documentação: [configuração da API](https://developers.google.com/maps/documentation/javascript/get-api-key), [marcadores avançados e Map ID](https://developers.google.com/maps/documentation/javascript/advanced-markers/start).

## React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
