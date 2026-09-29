# Análise funcional — desktop e mobile

Data: 13/09/2026. Escopo: estado atual do workspace, incluindo a reorganização de pastas.

## Atualização após as correções — 13/09/2026

As 14 falhas abaixo receberam correções. O restante deste documento preserva o
diagnóstico anterior para comparação com as evidências originais.

- Cadastro: campos obrigatórios e UF validados por etapa e no serviço; erro recebe
  foco; ponto no mapa ou coordenadas manuais precisam de confirmação; Educação
  incluída; URLs de foto validadas e imagens com erro recebem fallback.
- Layout: campo de foto e ações empilhados em telas pequenas; painel com limite de
  altura também no desktop; fundos dos controles corrigidos nos temas de contraste.
- Armazenamento: falhas deixam a aplicação em modo temporário, com aviso visível;
  leitura de listas protegida contra JSON inválido.
- Navegação: Mapa ativa a visualização correta; detalhes locais usam `?local=ID` e
  são restaurados ao recarregar ou navegar pelo histórico.
- Compartilhamento: botão identificado como **Compartilhar localização**, enviando
  o destino exato no Google Maps. Os dados comunitários locais não são publicados
  por esse link. Compartilhar o cadastro completo entre dispositivos continua
  dependendo de persistência remota.
- Busca normaliza acentos, caixa e espaços; registros sem avaliações não mostram
  nota fictícia; progresso ARIA usa intervalo 1–4; leitura respeita a preferência
  desativada e pode ser reativada no painel; Escape fecha o painel e retorna o foco.

Validação: **10 testes automatizados e 25 verificações no Chrome passaram**;
build concluído e lint sem erros, com os dois avisos de Fast Refresh já existentes.
O build ainda informa o tamanho do bundle. Resultados da rodada de correção:
[regressions-fixed.json](auditoria-desktop-mobile/regressions-fixed.json).

Para repetir os testes de navegador, execute o build e o preview na porta 4173 e
abra um Chrome com **perfil de teste isolado**, depuração remota na porta 9222.
Execute `npm run test:browser`. Esse roteiro limpa os dados do endereço local no
perfil de teste e bloqueia HTTPS externo; não valida Google Maps/Places, Supabase,
voz real ou VLibras. As limitações de integrações externas e dispositivos reais
registradas na análise continuam aplicáveis.

**Conclusão: não é possível considerar todas as funcionalidades funcionando.**
Os fluxos locais principais respondem, mas existem falhas reproduzidas no cadastro,
na navegação, na responsividade e nos recursos de acessibilidade. As integrações
externas ainda exigem validação com rede disponível e em dispositivos reais.

## Método e limites

- Revisão dos componentes, telas, serviços, estilos e integração de dados.
- Execução de `npm.cmd test`, `npm.cmd run lint` e `npm.cmd run build`.
- Testes no build de produção servido por Vite Preview, em Chrome headless local,
  com perfil isolado. Os cadastros e avaliações de teste ficaram apenas nesse perfil.
- Automação pelo protocolo do Chrome: ações no DOM, eventos de teclado, leitura de
  estilos e dimensões, capturas de tela e verificação do armazenamento.
- Emulação de tamanhos de tela; não equivale a testes em Android/iPhone reais,
  Safari, Firefox, leitores de tela ou teclado virtual. Não foi validado áudio real.
- Inicialmente foram usadas as integrações reais. A rede do ambiente apresentou
  `net::ERR_NETWORK_ACCESS_DENIED`, registrado para fontes externas e VLibras;
  mapa e locais próximos também exibiram falha de carregamento. Isso não demonstra
  que os provedores ou a chave estejam incorretos no ambiente publicado.
- Na rodada final de testes locais, requisições HTTPS externas foram bloqueadas
  explicitamente no navegador de teste para eliminar esperas. A síntese de voz
  foi simulada apenas para verificar se a preferência de desativação é respeitada.
- Nenhuma alteração no código da aplicação ou em banco remoto foi feita nesta análise.

## Verificações automatizadas

| Verificação | Resultado |
| --- | --- |
| Testes existentes | 6 passaram; cobrem estados de recursos e tratamento de respostas de rotas |
| Lint | Sem erros; 2 avisos de Fast Refresh em `AccessibilityContext.tsx` e `DisabilityBadge.tsx` |
| Build | Concluído; aviso de bundle JavaScript de 526,21 kB antes de gzip |

Esses seis testes não cobrem todos os fluxos de interface nem as integrações reais.

## Fluxos exercitados

| Funcionalidade | Resultado e limite |
| --- | --- |
| Abertura da aplicação e configuração inicial | Renderizam; aplicação da preferência de leitor de tela seleciona a lista e reforça o foco |
| Navegação para cadastro e retorno | Funcionam; detalhes e filtros não são representados na URL |
| Alternador interno Mapa/Lista | Alterna a interface; o carregamento real do mapa ficou sem validação |
| Botão Mapa da navegação | Falha ao partir da lista, tanto no desktop quanto no mobile |
| Cadastro manual e persistência | Salva no navegador e reaparece na exploração quando atende aos filtros; validações incompletas |
| Checklist de cadastro | Seleção Sim/Não/Não verificado funciona; observação aparece ao selecionar Sim |
| Fotos por URL | Adição e remoção respondem; URL inválida é aceita e há overflow em 320 px |
| Detalhes do cadastro | Abrem, exibindo descrição, critérios, avaliação e imagem de fallback |
| Avaliação e denúncia | Gravadas e refletidas localmente; não foram enviadas a um serviço de moderação |
| Busca textual local | Funciona com a grafia exata; falha no caso sem acento testado |
| Filtro de mobilidade e somente verificados | Funcionam para os registros locais testados; pendentes são excluídos por somente verificados |
| Preferências | Salvas e reaplicadas após recarregar; modal recebe foco e contém o ciclo de Tab testado |
| Tamanho de fonte e contraste | Classes e estilos são aplicados; problemas de legibilidade e altura descritos abaixo |
| Compartilhamento | O código compartilha a URL inicial, sem identificar o estabelecimento; envio nativo não foi realizado |
| Voz, VLibras e localização real | Validação em dispositivo/navegador real pendente |

## Falhas confirmadas e prioridades

### 1. Alta — campos obrigatórios não são validados

Na etapa 1, preencher somente o nome permite avançar sem descrição. Na etapa 2,
preencher o endereço e apagar cidade e UF também permite avançar. Um cadastro foi
salvo com descrição vazia. Os atributos `required` estão fora de um formulário
submetido pelo navegador, e a navegação só verifica nome e endereço.

Local: `src/views/MerchantRegisterWizard.tsx:603` e `:128`.
Correção proposta: validar todos os campos obrigatórios por etapa e novamente no
envio, anunciando o erro e direcionando o foco ao campo correspondente.

### 2. Alta — cadastro pode gravar coordenadas sem confirmar o local

Sem vincular um resultado Google e sem selecionar um ponto, o cadastro manual
salvou `-21.3924, -42.6896`, independentemente do endereço digitado. Com mapa
indisponível, não há campo alternativo para informar coordenadas.

Local: `src/views/MerchantRegisterWizard.tsx:84` e `:443`.
Correção proposta: exigir confirmação de localização ou representar coordenadas
como não informadas, sem atribuir automaticamente o centro da cidade ao local.

### 3. Alta — etapa de fotos ultrapassa a largura em mobile de 320 px

A largura útil de 320 px resultou em conteúdo de 342 px. O campo de foto e seus
controles ultrapassam o contêiner. Em 360 e 390 px, esse overflow não apareceu
nos testes com a fonte padrão.

Local: `src/views/MerchantRegisterWizard.tsx:538` e `:583`.
Correção proposta: permitir encolhimento dos campos e empilhar os grupos de botões
quando faltar espaço. [Captura](auditoria-desktop-mobile/mobile-320-photos.png).

### 4. Alta — painel de acessibilidade fica fora da tela em desktop baixo

Em 1366 × 600 com fonte Extra, o painel começa em aproximadamente **-126 px**.
O título e os controles superiores ficam fora da área visível. A limitação de
altura existe somente na regra de largura inferior a 1024 px.

Local: `src/components/accessibility/AccessibilityToolbar.tsx:78` e
`src/styles/design-system.css:146`.
Correção proposta: limitar altura e permitir rolagem em todas as larguras.
[Captura](auditoria-desktop-mobile/desktop-short-panel.png).

### 5. Alta — modo amarelo/preto deixa texto sobre fundo claro

Após o término da transição, o botão “Refazer configuração guiada” apresentou
texto `rgb(255, 255, 0)` sobre fundo `rgb(237, 252, 249)`. O modo altera a cor do
texto, mas não cobre todos os fundos utilizados nos componentes.

Local: `src/styles/index.css:119` e
`src/components/accessibility/AccessibilityToolbar.tsx:232`.
Correção proposta: tratar fundos, texto e estados dos controles de maneira
consistente no tema. [Captura](auditoria-desktop-mobile/mobile-extra-contrast.png).

### 6. Alta — falha no armazenamento local pode impedir a abertura inteira

Foi simulada uma exceção `QuotaExceededError` em `Storage.setItem`. Com o documento
completamente carregado, `#root` ficou vazio e o Chrome registrou a exceção. Antes
da simulação e após removê-la, a aplicação voltou a renderizar.

Local: `src/services/storageService.ts:27` e `:45`; gravações adicionais em
`src/context/AccessibilityContext.tsx:58` também precisam de tratamento.
Correção proposta: proteger inicialização, leitura e escrita, apresentar erro
compreensível e permitir funcionamento temporário sem persistência quando possível.

### 7. Média — navegação Mapa não ativa o mapa

Selecionar Lista e depois “Mapa” na barra mobile ou “Mapa & Catálogo” no desktop
mantém o rádio Lista selecionado. A navegação apenas muda a aba principal e rola
para `results-section`, sem atualizar `viewMode`.

Local: `src/components/layout/Navbar.tsx:12`.
Correção proposta: transmitir a intenção de abrir o mapa à tela de exploração.

### 8. Média — compartilhamento não preserva o local

Ao abrir detalhes, a URL permanece `/`. Recarregar perde a tela de detalhes,
apesar de o cadastro continuar salvo. O compartilhamento e a cópia usam essa mesma
URL, portanto o destinatário não recebe um link específico para o estabelecimento.

Local: `src/views/EstablishmentDetailView.tsx:116` e `src/App.tsx:15`.
Correção proposta: criar URL por estabelecimento e resolver o registro por um
identificador compartilhável; registros exclusivamente locais também exigem
persistência remota para acesso por outra pessoa.

### 9. Média — categoria Educação ausente no cadastro manual

Educação existe na exploração e nos tipos, mas não entre as oito opções do select
de categoria do cadastro. Não é possível escolhê-la manualmente.

Local: `src/views/MerchantRegisterWizard.tsx:285`.
Correção proposta: reutilizar uma definição comum de categorias no filtro e cadastro.

### 10. Média — busca local não normaliza acentos

Com “Auditoria Café” cadastrado, “Auditoria Cafe” retornou zero resultados locais;
“Auditoria Café” retornou um. A busca local só aplica `toLowerCase`, enquanto a
busca complementar usa outra normalização.

Local: `src/services/storageService.ts:70`.
Correção proposta: compartilhar a normalização de espaços, caixa e acentos.

### 11. Média — URL inválida aceita como foto

Adicionar `invalid-photo-url` inseriu uma imagem com esse `src`. O tipo `url` do
campo não é validado pelo botão de adição. Também não há fallback de erro de imagem.

Local: `src/views/MerchantRegisterWizard.tsx:116`.
Correção proposta: validar URL/protocolo e tratar falhas ao carregar a imagem.

### 12. Média — cadastro novo mostra nota 5 sem avaliações

O registro recém-criado apareceu com nota 5 e zero avaliações. O valor é atribuído
por padrão, sem participação da comunidade.

Local: `src/services/storageService.ts:131`.
Correção proposta: representar ausência de avaliações e mostrar “Sem avaliações”.

### 13. Média — valor ARIA do progresso fora do intervalo

Na etapa 3, o componente apresentou `aria-valuenow="75"` e `aria-valuemax="4"`.
Todas as etapas usam porcentagem como valor atual e número de etapas como máximo.

Local: `src/views/MerchantRegisterWizard.tsx:195`.
Correção proposta: usar intervalo 0–100 ou 1–4 de maneira consistente.

### 14. Média — preferência de desativar voz não é respeitada pelo botão

A configuração “Uso leitor de tela” salvou `voiceReadingEnabled: false`, mas o
botão Ouvir continuou chamando `speechSynthesis.speak`. Isso foi confirmado com
síntese simulada; a qualidade e a saída real de áudio não foram avaliadas.

Local: `src/components/accessibility/AudioReaderButton.tsx:18` e
`src/context/AccessibilityContext.tsx:119`.
Correção proposta: definir e aplicar o comportamento esperado da preferência nos
controles de leitura, incluindo uma forma clara de reativá-la.

## Responsividade observada

| Tela ou estado | Dimensões testadas | Observação |
| --- | --- | --- |
| Início | 1440×900, 1024×768, 768×1024, 390×844, 360×800, 320×568, 844×390 | Sem rolagem horizontal global; categorias usam rolagem interna no mobile |
| Cadastro: checklist | Larguras 320, 360, 390, 768 e 1440 | Sem overflow global nos estados testados |
| Cadastro: fotos | Larguras 320, 360, 390, 768 e 1440 | Overflow confirmado em 320 px |
| Detalhes | 390×844 e 1440×900 | Renderizaram; em mobile os textos das ações superiores quebram em várias linhas |
| Painel com fonte Extra | 390×844, 1366×768, 1366×600 | Rolagem interna no mobile; corte vertical no desktop de 600 px de altura |

## Integrações e limitações de produto

- **Persistência remota:** `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY` não estão preenchidas no ambiente local revisado.
  Cadastro, avaliações e denúncias usam `localStorage`. Eles não sincronizam
  automaticamente entre desktop, celular ou usuários. Isso já é apresentado como
  limitação de protótipo em parte da interface, não como publicação remota concluída.
- **Supabase:** mesmo configurado, o serviço atual usa RPC para consulta de
  acessibilidade por `place_id`; o cadastro não chama essa integração para gravar.
  Autenticação, publicação/moderação remota e sincronização não foram validadas.
- **Google Maps/Places:** variáveis locais de chave e Map ID estão preenchidas,
  sem revelar seus valores. Rede, permissões de chave, resultados, pinos e interação
  real com o mapa precisam ser testados em ambiente com acesso externo.
- **Rotas:** testes unitários validam geometria e falhas simuladas, mas não confirmam
  o trajeto real, geolocalização nem adequação de acessibilidade do percurso.
- **VLibras, fontes e voz:** dependem de recursos externos ou do navegador. A fonte
  Lexend real não pôde ser validada com o carregamento externo bloqueado.
- **Teclado:** o modal de preferências passou no teste de entrada e ciclo de foco.
  Escape não fechou o painel flutuante. Não foi feita certificação de navegação
  completa por teclado, nem avaliação com NVDA/VoiceOver/TalkBack.

## Evidências e próximos passos

Resultados brutos: [fluxos](auditoria-desktop-mobile/flows.json),
[testes adicionais](auditoria-desktop-mobile/extended.json) e
[confirmações finais](auditoria-desktop-mobile/final-checks.json).
O caso de armazenamento foi confirmado novamente na rodada final, com comparação
antes/depois; essa confirmação substitui a observação preliminar da rodada adicional.

Priorizar as falhas de cadastro, posicionamento, telas pequenas, contraste e
resiliência de armazenamento. Depois corrigir navegação, URLs e consistência dos
controles. Repetir os casos afetados e completar testes reais de Maps, Places,
rotas, Supabase, voz e VLibras em Android/Chrome e iPhone/Safari antes de afirmar
compatibilidade integral entre desktop e mobile.
