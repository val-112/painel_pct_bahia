# Painel de Comunidades Tradicionais da Bahia

Dashboard geoespacial interativo para visualizacao de Povos e Comunidades Tradicionais (PCT) no Estado da Bahia.

O painel reune mapa interativo, filtros, KPIs, graficos dinamicos e tabela de consulta para analise territorial por municipio, Territorio de Identidade, RPGA/bacia, tipo de comunidade, fonte e tipo de dado espacial.

© Valdenir Barbosa | Instituto Rios e Raízes | v1.0

## Tecnologias

- React
- Vite
- TanStack Start / TanStack Router
- TanStack Query
- Leaflet / React Leaflet
- Recharts
- Tailwind CSS

## Como Rodar Localmente

Instale as dependencias:

```bash
npm install
```

Rode o painel em modo de desenvolvimento:

```bash
npm run dev
```

Depois abra a URL exibida no terminal, normalmente:

```text
http://localhost:5173
```

## Build E Preview

Gerar a versao de producao:

```bash
npm run build
```

O build estatico para GitHub Pages fica em:

```text
dist/client
```

Testar localmente a versao de producao:

```bash
npm run preview
```

Como o projeto esta configurado para GitHub Pages em subpasta, a base publica atual e:

```text
/painel_pct_bahia/
```

Se o nome do repositorio mudar, atualize o valor `base` em `vite.config.ts`.

## Dados

Os dados do painel ficam em:

```text
public/data/
```

Arquivos atuais:

- `base.json`: base analitica principal dos registros PCT.
- `municipios.geojson`: camada municipal da Bahia.
- `territorios-identidade.geojson`: camada de Territorios de Identidade da Bahia.
- `municipio-territorio.json`: indice de associacao entre municipio e Territorio de Identidade.
- `rpga.geojson`: camada de RPGAs/bacias.
- `poligonal.geojson`: territorios com poligonal.
- `pontos.geojson`: territorios com ponto.

Para atualizar os dados, substitua os arquivos mantendo os mesmos nomes e a mesma estrutura de campos esperada pelo codigo em `src/lib/pct.ts`.

## Imagens

As imagens publicas do painel ficam em:

```text
public/images/
```

Arquivos atuais:

- `banner.png`: faixa superior do painel.
- `painel-logo.png`: identidade visual principal do painel.
- `share-preview.png`: imagem de previsualizacao para compartilhamento do link.
- `favicon.png`, `favicon-32.png`, `favicon-192.png`, `favicon-512.png`: icones do painel.
- `rioz-logo.jpg`: logo do Instituto Rios e Raizes.

Para atualizar logo ou faixa, substitua os arquivos mantendo os mesmos nomes.

## Arquivos Principais

- `src/routes/index.tsx`: tela principal e sincronizacao entre filtros, mapa, KPIs, graficos e tabela.
- `src/lib/pct.ts`: tipos, carregamento dos dados, filtros, agregacoes e escalas de cor.
- `src/components/pct/MapPanel.tsx`: mapa, camadas, coropleticos, pontos, poligonos e popups.
- `src/components/pct/LayerControl.tsx`: modos e camadas do mapa.
- `src/components/pct/FilterPanel.tsx`: filtros do painel.
- `src/components/pct/KpiCards.tsx`: indicadores dinamicos.
- `src/components/pct/ChartsPanel.tsx`: graficos dinamicos.
- `src/components/pct/DataTable.tsx`: tabela de consulta, ordenacao e paginacao.
- `src/components/pct/AboutDialog.tsx`: botao Sobre.

## Publicacao No GitHub Pages

Este projeto ja inclui um workflow em:

```text
.github/workflows/deploy.yml
```

O workflow:

- instala dependencias com `npm ci`;
- roda `npm run build`;
- publica `dist/client` no GitHub Pages.

No GitHub, va em:

```text
Settings > Pages > Build and deployment > Source
```

Selecione:

```text
GitHub Actions
```

Depois, a cada `push` para `main` ou `master`, o site sera publicado automaticamente.

Endereco esperado, se o usuario do GitHub for `USUARIO` e o repositorio for `painel_pct_bahia`:

```text
https://USUARIO.github.io/painel_pct_bahia/
```

## Fluxo Sugerido Com GitHub Desktop

1. Abra o GitHub Desktop.
2. Use `File > Add local repository`.
3. Selecione esta pasta do projeto.
4. Se ainda nao houver repositorio Git, escolha criar/inicializar o repositorio.
5. Faca o primeiro commit com os arquivos do projeto.
6. Publique no GitHub com o nome `painel_pct_bahia`.
7. No GitHub, habilite Pages usando `GitHub Actions`.

## Observacoes De Manutencao

- Mantenha dados publicos em `public/data/`.
- Mantenha imagens publicas em `public/images/`.
- Evite caminhos locais como `C:\Users\...` dentro do codigo.
- Para publicacao em subpasta, use sempre caminhos baseados em `import.meta.env.BASE_URL`.
- Nao reorganize componentes grandes sem testar mapa, filtros, KPIs, graficos e tabela em conjunto.
