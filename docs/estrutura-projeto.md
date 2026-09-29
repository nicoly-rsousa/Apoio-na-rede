# Estrutura do projeto

```text
src/
  assets/                    Imagens e arquivos importados pelo código
  components/
    accessibility/           Preferências, recursos e controles de acessibilidade
    establishments/          Painel de local e selo de verificação
    explore/                 Categorias, apresentação e sugestões de locais
    layout/                  Navegação compartilhada
    maps/                    Mapa e legenda
  context/                   Estado compartilhado de acessibilidade
  data/                      Categorias, recursos e dados de demonstração
  lib/                       Clientes e configuração de integrações externas
  services/                  Consultas, rotas e armazenamento
  styles/                    Estilos globais e design system
  types/                     Tipos compartilhados do domínio
  utils/                     Funções utilitárias, como formatação de distância
  views/                     Telas de exploração, detalhe e cadastro
  App.tsx                    Composição da aplicação e navegação entre telas
  main.tsx                   Entrada do React e importação dos estilos globais
public/                      Arquivos públicos servidos sem transformação
database/                    Scripts SQL complementares
docs/                        Documentação técnica e de manutenção
tests/                       Testes automatizados
supabase_schema.sql          Schema base do banco
```

Coloque componentes na pasta da responsabilidade correspondente. As telas ficam em
`views/` e combinam esses componentes. Use `services/` para acesso a dados e
`utils/` para funções sem acesso a serviços externos. Mantenha imports diretos
relativos ao arquivo de destino.

Os estilos carregados por `main.tsx` ficam em `styles/index.css` e
`styles/design-system.css`. O arquivo `styles/App.css` foi preservado, mas não é
importado atualmente pela aplicação.

As configurações de Vite, TypeScript, lint e deploy permanecem na raiz, junto com
`package.json` e o lockfile. `node_modules/` contém dependências instaladas e
`dist/` contém o resultado gerado pelo build; não são pastas de código-fonte.

Após mover arquivos, ajuste seus imports e as referências na documentação.
Valide com `npm test`, `npm run lint` e `npm run build`.
