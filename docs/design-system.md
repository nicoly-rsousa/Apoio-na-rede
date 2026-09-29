# Design system — Apoio na Rede

A referência visual foi adaptada ao contexto de acessibilidade urbana: fundo escuro, superfícies grafite, destaque verde-turquesa da logo, busca arredondada, cartões de categorias e navegação inferior no celular. Textos, locais e ações pertencem ao app; a ilustração da abertura é vetorial e decorativa.

## Tokens

Definidos em `src/styles/design-system.css`:

| Token | Valor | Uso |
| --- | --- | --- |
| `--ds-background` | `#101111` | Fundo da aplicação |
| `--ds-surface` | `#1b1c1c` | Cartões e painéis |
| `--ds-raised` | `#242525` | Controles e superfícies elevadas |
| `--ds-border` | `#363737` | Bordas discretas |
| `--ds-text` | `#f5f3ed` | Texto principal |
| `--ds-muted` | `#b5b6b2` | Texto de apoio |
| `--ds-accent` | `#16bea8` | Ações, seleção e destaques |
| `--ds-accent-ink` | `#022f30` | Texto sobre verde-turquesa da logo |
| `--ds-radius` | `20px` | Cartões principais |

Tipografia: Manrope. Tamanhos de texto em rem permitem respeitar a escala de fonte existente. Lexend continua disponível no modo de leitura facilitada. Classes antigas de superfície são traduzidas pelo tema para preservar formulários, painéis e detalhes já existentes.

## Componentes

### Descoberta centrada nos estabelecimentos

O catálogo mostra um cartão por resultado, com foto e duas ações: “Como chegar” abre o Google Maps e “Acessibilidade” expande os recursos dentro do cartão. Selecionar uma sugestão concentra a lista no resultado escolhido, sem repetir destaques ou painéis. Os estabelecimentos cadastrados aparecem antes dos resultados externos. Atendimento em Libras integra o resumo; ausência de informação continua como “Não verificado”.

Os cartões usam a foto cadastrada ou a primeira foto retornada pelo Google Places, com os créditos dos autores. Fotos ausentes ou indisponíveis mostram “Foto não disponível”. Endereços sem um estabelecimento identificado não recebem fotos de outros locais.

### Mapas nos cartões

O catálogo usa apenas mapas híbridos 2D da Maps JavaScript API com marcador e Street View desativado. O componente HybridMapPreview usa DEMO_MAP_ID. A chave deve ser uma Maps Demo Key para prototipagem sem faturamento; DEMO_MAP_ID sozinho não torna uma chave comum gratuita. O uso em produção não é coberto pela chave demo.

PlaceCatalog ordena os locais por proximidade e limita as sugestões iniciais a cinco. A busca exibe os resultados sem depender da cobertura ou do carregamento das imagens. Falhas do mapa preservam os botões Como chegar e Acessibilidade.

- `Navbar`: “Catálogo” no desktop e no celular direciona aos cartões. A barra inferior mantém Início, Buscar, Catálogo, Cadastrar e Ajustes.
- `ExplorerHero`: apresentação com mapa vetorial decorativo, sem downloads de imagens ou chamadas de API adicionais.
- `ExploreCategories`: faixa de orientação e nove categorias com ícones, seleção e botão para limpar a categoria.
- `PlaceDiscoveryCards`: locais reais já carregados pelo serviço atual, sem avaliações, fotos ou informações de acessibilidade inventadas.
- Busca: campo arredondado, filtro expansível e entrada por voz. Sugestões e teclado preservados.

## Responsividade e acessibilidade

- Desktop a partir de 1024px: cabeçalho horizontal, abertura em duas colunas, nove categorias e quatro cartões por linha.
- Tablet: navegação inferior, categorias em grade e dois cartões por linha.
- Celular até 600px: abertura compacta, categorias com rolagem horizontal e cartões de resultado empilhados.
- A barra inferior respeita `safe-area-inset-bottom`; os controles flutuantes ficam acima dela. VLibras não sobrepõe painéis abertos.
- Link para pular ao conteúdo, foco visível, rótulos, estado de seleção e alvos de navegação preservados.
- Alto contraste e amarelo/preto têm precedência sobre o tema. Redução de movimento e estímulos permanece disponível.

Para conferir: abra o site em desktop e celular, alterne filtros e categorias, selecione um local e teste cadastro, preferências, fonte ampliada e modos de contraste.
