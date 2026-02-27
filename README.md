# 🐙 Call of Cthulhu — Ficha de Personagem

Sistema de fichas de personagem para o RPG **Call of Cthulhu 7ª Edição**, com dados persistidos em SQLite, rolador de dados, vista do mestre, evidências e visualizador de livros/PDFs.

---

## Funcionalidades

- Criação e gerenciamento de múltiplos investigadores
- Cálculo automático de HP, MP, Sanidade, MOV e habilidades derivadas (CoC 7e)
- Pontos de habilidade de ocupação (EDU×4) e interesse (INT×2) com rastreamento em tempo real
- Rolador de dados com dados bônus/penalidade e níveis de sucesso CoC 7e
- Vista do Mestre com vitais de todos os investigadores
- Upload de PDFs (livros, módulos) com visualizador integrado e busca nativa
- Evidências da sessão com imagens, tags e notas
- Exportação/importação de personagens em JSON
- Configuração de fórmulas de derivação via interface
- Retrato do personagem

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

## API resumida

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/characters` | Lista personagens |
| `POST` | `/api/characters` | Cria personagem |
| `PUT` | `/api/characters/:id` | Atualiza personagem |
| `DELETE` | `/api/characters/:id` | Remove personagem |
| `GET` | `/api/export/:id` | Exporta personagem como JSON |
| `POST` | `/api/import` | Importa personagem de JSON |
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
