# 🐙 Call of Cthulhu — Ficha de Personagem

Sistema de fichas de personagem para o RPG **Call of Cthulhu 7ª Edição**, com dados persistidos em SQLite, rolador de dados, vista do mestre, evidências e visualizador de livros/PDFs.

---

## Funcionalidades

### Personagem
- Criação e gerenciamento de múltiplos investigadores
- Cálculo automático de HP, MP, Sanidade, MOV e habilidades derivadas (CoC 7e)
- Retrato do personagem com **visualização em tela cheia** (clique na foto)
- **Bens e Riqueza**: rastreamento de Dinheiro em Mãos, Nível de Gastos e Patrimônio

### Habilidades (Perícias)
- 63 habilidades padrão do CoC 7e, incluindo todas as **ciências especializadas** (Biologia, Química, Física, Farmácia, Forense, Geologia, Matemática, Meteorologia, Botânica, Zoologia, Engenharia, Criptografia)
- **3 campos de input por habilidade**: Pts. Ocupação (OC), Pts. Interesse (IN) e Pts. durante o Jogo (JG)
- Total calculado automaticamente: Base + OC + IN + JG
- **Tooltips informativos** em cada habilidade (hover para ver a descrição)
- Rastreamento de pontos de ocupação (EDU×4) e interesse (INT×2) em tempo real

### Combate
- **Autocomplete de armas** com 20 armas canônicas do CoC 7e (preenche dano, alcance, munição automaticamente)
- **Botão de rolar por arma** (busca automaticamente a habilidade correspondente no personagem)

### Compartilhamento
- **Exportar Amigo**: gera um JSON sem os campos de lore/histórico para compartilhar com o grupo
- **Modal de Amigos** (👥): visualize fichas resumidas dos outros jogadores (HP/MP/SAN, habilidades top, armas)
- **Sistema UUID**: cada personagem tem um UUID único; ao importar um personagem existente, ele é **atualizado** em vez de duplicado

### Outros
- Rolador de dados com dados bônus/penalidade e níveis de sucesso CoC 7e
- Vista do Mestre com vitais de todos os investigadores
- Upload de PDFs (livros, módulos) com visualizador integrado e busca nativa
- Evidências da sessão com imagens, tags e notas
- Configuração de fórmulas de derivação via interface

---

## Requisitos

### Sem Docker
- **Node.js** v18 ou superior — https://nodejs.org
- **npm** v9 ou superior (incluído com o Node.js)

### Com Docker
- **Docker** v24 ou superior — https://docs.docker.com/get-docker/
- **Docker Compose** v2 ou superior (incluído no Docker Desktop)

---

## Rodando sem Docker

### 1. Clone ou baixe o projeto

```bash
git clone <url-do-repositorio>
cd callofcutchulo
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Inicie o servidor

```bash
npm start
```

Ou com reinicialização automática ao editar arquivos (modo desenvolvimento):

```bash
npm run dev
```

### 4. Acesse no navegador

```
http://localhost:3000
```

O banco de dados `cthulhu.db` e a pasta `books/` serão criados automaticamente na raiz do projeto na primeira execução.

---

## Rodando com Docker

### Opção A — Docker Compose (recomendado)

É a forma mais simples. O Compose gerencia o build, a porta e os volumes automaticamente.

#### 1. Build e inicialização

```bash
docker compose up --build
```

Na primeira execução o Docker fará o build da imagem. As execuções seguintes usam o cache e sobem mais rápido:

```bash
docker compose up
```

#### 2. Rodar em segundo plano (detached)

```bash
docker compose up -d --build
```

Para ver os logs enquanto roda em segundo plano:

```bash
docker compose logs -f
```

#### 3. Parar o serviço

```bash
docker compose down
```

#### 4. Acesse no navegador

```
http://localhost:3000
```

---

### Opção B — Docker puro (sem Compose)

Se preferir não usar o Compose, execute manualmente:

#### 1. Build da imagem

```bash
docker build -t cthulhu-sheet .
```

#### 2. Rodar o container com volumes persistidos

```bash
docker run -d \
  --name cthulhu-sheet \
  -p 3000:3000 \
  -v "$(pwd)/cthulhu.db:/app/cthulhu.db" \
  -v "$(pwd)/books:/app/books" \
  cthulhu-sheet
```

> **Windows (PowerShell):** substitua `$(pwd)` por `${PWD}`:
> ```powershell
> docker run -d `
>   --name cthulhu-sheet `
>   -p 3000:3000 `
>   -v "${PWD}/cthulhu.db:/app/cthulhu.db" `
>   -v "${PWD}/books:/app/books" `
>   cthulhu-sheet
> ```

#### 3. Parar e remover o container

```bash
docker stop cthulhu-sheet
docker rm cthulhu-sheet
```

---

## Persistência de dados (volumes)

Dois recursos precisam sobreviver ao ciclo de vida do container:

| Recurso | Caminho no container | Caminho no host |
|---|---|---|
| Banco de dados SQLite | `/app/cthulhu.db` | `./cthulhu.db` |
| PDFs enviados | `/app/books/` | `./books/` |

### Como funciona

- **`cthulhu.db`** — arquivo único que contém todos os personagens, habilidades, evidências e configurações. O arquivo é criado automaticamente se não existir.
- **`books/`** — pasta onde os PDFs enviados pelo visualizador de livros são armazenados.

Enquanto os volumes estiverem mapeados, destruir e recriar o container **não apaga nenhum dado**.

### Backup

Para fazer backup dos dados basta copiar esses dois itens:

```bash
cp cthulhu.db cthulhu.db.backup
cp -r books/ books_backup/
```

### Migrar para outra máquina

1. Copie `cthulhu.db` e a pasta `books/` para a nova máquina
2. Coloque-os na raiz do projeto
3. Suba normalmente com `docker compose up` ou `npm start`

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta em que o servidor escuta |
| `NODE_ENV` | `development` | Ambiente (`production` desativa logs extras) |

Exemplo para rodar em outra porta:

```bash
PORT=8080 npm start
```

Ou no Docker Compose, edite `docker-compose.yml`:

```yaml
environment:
  - PORT=8080
ports:
  - "8080:8080"
```

---

## Estrutura do projeto

```
callofcutchulo/
├── server.js          # Servidor Express + API REST
├── database.js        # Esquema SQLite e queries
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── cthulhu.db         # Criado automaticamente (não commitar)
├── books/             # PDFs enviados (não commitar)
└── public/
    ├── index.html
    ├── style.css
    └── app.js
```

---

## Telas e Possibilidades

### Aba Investigador
```
┌─────────────────────────────────────────────────────────┐
│  [Foto]  Nome do Investigador          [Exportar] [👥]  │
│          Jogador | Ocupação            [Exportar Amigo] │
├─────────────────────────────────────────────────────────┤
│  Informações Pessoais: Idade, Gênero, Residência        │
│                                                         │
│  Características:                                       │
│  FOR | DES | INT | CON | APA | POD | TAM | EDU | LUCK  │
│  (cada uma com Metade, Quinto e botão 🎲 de teste)      │
│                                                         │
│  Status Vitais: HP | MP | SAN | MOV                     │
│  Flags: Insanidade Temp/Indef, Ferimento Grave, Inconsc │
│                                                         │
│  💰 Bens e Riqueza:                                     │
│  Dinheiro em Mãos | Nível de Gastos | Patrimônio        │
└─────────────────────────────────────────────────────────┘
```

### Aba Habilidades
```
┌─────────────────────────────────────────────────────────┐
│  Pts. Ocupação (EDU×4): 42/200 ████░░  12 disp.        │
│  Pts. Interesse (INT×2): 0/100  ░░░░░  100 disp.       │
├─────────────────────────────────────────────────────────┤
│  Habilidade          │Base│ OC │ IN │ JG │Total│½/⅕│🎲 │
│  Accounting (Cont.)  │  5 │ 45 │  0 │  0 │  50 │25/10│🎲│
│  (hover = tooltip)   │    │    │    │    │     │   │   │
│  ...63 habilidades...│    │    │    │    │     │   │   │
└─────────────────────────────────────────────────────────┘
```

### Aba Combate
```
┌─────────────────────────────────────────────────────────┐
│  Armas                                    [+ Adicionar] │
│  ┌──────────┬──────────┬──────┬────┬─────┬──────┬───┐  │
│  │ Arma     │ Habili.  │ Dano │Alc.│ Atq │ Mun. │🎲 │  │
│  │[autocmpl]│[autocmpl]│1d10  │15m │1/2  │  6   │🎲 │  │
│  └──────────┴──────────┴──────┴────┴─────┴──────┴───┘  │
│  (datalist com 20 armas canônicas do CoC 7e)            │
│                                                         │
│  Equipamentos e Posses                  [+ Adicionar]   │
└─────────────────────────────────────────────────────────┘
```

### Modal Amigos (👥)
```
┌─────────────────────────────────────────────────────────┐
│  👥 Personagens dos Amigos    [📥 Importar Amigo]       │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ [Foto]  Nome │  │ [Foto]  Nome │  │ [Foto]  Nome │  │
│  │ Ocupação, XX │  │              │  │              │  │
│  │ HP ████ 10/10│  │              │  │              │  │
│  │ SAN ██░ 45/50│  │              │  │              │  │
│  │ MP ████ 10/10│  │              │  │              │  │
│  │ Skills top 5 │  │              │  │              │  │
│  │ 🗡 Armas     │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Exportação/Importação entre Jogadores
```
Jogador A                           Jogador B
┌─────────────┐                    ┌─────────────┐
│ Ficha do    │ → Exportar Amigo → │ Importar    │
│ Personagem  │   (sem lore/hist.) │ Amigo (👥)  │
│ UUID: abc123│   UUID preservado  │             │
│             │                    │ Ver resumo  │
│ Atualiza    │ ← Re-importar ←    │ HP/SAN/MP   │
│ sem duplicar│   mesmo UUID       │ habilidades │
└─────────────┘                    └─────────────┘
```

---

## API resumida

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/characters` | Lista personagens |
| `POST` | `/api/characters` | Cria personagem |
| `PUT` | `/api/characters/:id` | Atualiza personagem |
| `DELETE` | `/api/characters/:id` | Remove personagem |
| `GET` | `/api/export/:id` | Exporta personagem completo como JSON |
| `GET` | `/api/export-friend/:id` | Exporta personagem sem lore (versão amigo) |
| `POST` | `/api/import` | Importa/atualiza personagem via UUID |
| `GET` | `/api/books` | Lista PDFs enviados |
| `POST` | `/api/books/upload` | Faz upload de PDF |
| `DELETE` | `/api/books/:filename` | Remove PDF |
| `GET` | `/api/evidence` | Lista evidências |
| `POST` | `/api/evidence` | Cria evidência |
| `PUT` | `/api/evidence/:id` | Atualiza evidência |
| `DELETE` | `/api/evidence/:id` | Remove evidência |
| `POST` | `/api/dice/roll` | Rola dados |
| `GET` | `/api/config` | Configurações de fórmulas |
| `PUT` | `/api/config` | Salva configurações |

---

## Banco de dados — Estrutura de Habilidades (v3)

O campo de habilidades foi reestruturado para rastrear a origem de cada ponto alocado:

| Campo | Descrição |
|---|---|
| `base_value` | Valor base da habilidade (fixo pelo sistema) |
| `occ_points` | Pontos alocados do pool de Ocupação (EDU×4) |
| `int_points` | Pontos alocados do pool de Interesse (INT×2) |
| `game_points` | Pontos ganhos durante o jogo |
| `value` | Total = base + occ + int + game (calculado automaticamente) |

**Migração automática**: personagens criados em versões anteriores são migrados automaticamente ao iniciar o servidor.
