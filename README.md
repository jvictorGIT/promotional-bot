# GarimpoBot

## Objetivo

Sistema que monitora promoções de e-commerce, coleta dados via scraping (Python), processa e classifica os descontos automaticamente (.NET 10) e exibe as promoções aprovadas em uma interface web (React + TypeScript + Tailwind), de forma recorrente, escalável e totalmente containerizada.

---

## Arquitetura

O projeto é dividido em três serviços que conversam entre si via HTTP e compartilham o mesmo banco de dados:

### 1. Scraper (Python - FastAPI + Playwright)
- Roda em `http://localhost:8000`
- Faz scraping de produtos em e-commerces (Amazon)
- Insere/atualiza os dados na tabela `Promocoes` do banco `Sales_Bot`
- Todos os registros entram com `Status = 'Pending'`
- Se o SKU já existe, atualiza preços e volta o status para `Pending` (permite reavaliação)
- Limpa preços vindos como string (`"R$ 89,90"` → `89.90`) antes de salvar
- Captura também a `ImageUrl` do produto

### 2. Processador + API (.NET 10 - Hangfire)
- Roda em `http://localhost:5249`
- Busca registros com `Status = 'Pending'` na tabela `Promocoes`
- Calcula o percentual de desconto: `1 - (PricePor / PriceDe)`
- Classifica:
  - `>= limite mínimo` → `Status = "Approved"`
  - `< limite mínimo` → `Status = "LowDiscount"`
  - `PriceDe = 0` → `Status = "InvalidPrice"`
- Limite mínimo de desconto é configurável em tempo real via API (e ajustável pela própria interface)
- Atualiza `Status` e `Percentual` no banco
- Expõe o endpoint público `GET /api/promocoes` com as promoções aprovadas, ordenadas pelo maior desconto
- CORS habilitado para o front-end consumir os dados

### 3. Front-end (React + TypeScript + Vite + Tailwind v4)
- Interface moderna e responsiva em `http://localhost:5173`
- Grid de cards com: imagem do produto, nome, preço "De" (riscado), preço "Por" em destaque, badge de desconto, valor economizado e botão "Aproveitar oferta"
- Paleta de cores temática de promoção (laranja/vermelho/lima sobre fundo escuro)
- Ajuste do limite mínimo de desconto direto no header
- Contador de ofertas ativas no topo da página
- Estados de loading, erro (com retry) e empty state
- Conversão automática de PascalCase (C#) para camelCase (TS) no consumo da API

---

## Fluxo de Execução

```
[Python Scraper] → Insere/Atualiza com Status='Pending'
        ↓
[Hangfire scrape-job] → Dispara o scraper a cada 15 min
        ↓
[Hangfire validacao-job] → Processa pendentes a cada 16 min
        ↓
[Terminal] → Exibe: Nome | Preço De | Preço Por | % | Status
        ↓
[API .NET /api/promocoes] → Disponibiliza aprovadas via HTTP
        ↓
[React Front-end] → Renderiza grid de cards responsivo
```

---

## Banco de Dados (SQL Server)

- **Hangfire**: banco `HangfireDB` (gerenciado pelo Hangfire)
- **Dados**: banco `Sales_Bot`, tabela `Promocoes`

### Tabela Promocoes

| Coluna     | Tipo            | Descrição                              |
|------------|-----------------|----------------------------------------|
| Id         | INT (PK)        | Auto-incremento                        |
| Sku        | INT             | Identificador do produto               |
| Name       | NVARCHAR        | Nome do produto                        |
| PriceDe    | DECIMAL(18,2)   | Preço original ("de")                  |
| PricePor   | DECIMAL(18,2)   | Preço com desconto ("por")             |
| Link       | NVARCHAR        | URL do produto                         |
| ImageUrl   | NVARCHAR(1000)  | URL da imagem do produto               |
| Status     | NVARCHAR        | Pending / Approved / LowDiscount / InvalidPrice |
| Percentual | DECIMAL(18,4)   | Percentual de desconto calculado       |

### Connection Strings (appsettings.json)

- `DefaultConnection` → `HangfireDB` (usado pelo Hangfire)
- `MainConnection` → `Sales_Bot` (usado pelo ProductRepository via Dapper)

---

## Estrutura do Projeto

```
PromotionalBot/
├── docker-compose.yml                    # Orquestra scraper + back + front
│
├── scraper_python/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── api/
│       ├── scraper.py                    # Playwright + Amazon
│       ├── scraper_api.py                # FastAPI (GET /scrape)
│       └── database/mainDb.py            # Persistência pyodbc
│
├── schedule_dotnet/schedule/
│   ├── Dockerfile
│   ├── Program.cs                        # DI, Hangfire, CORS, MapControllers
│   ├── Models/jsonModel.cs               # Model da tabela Promocoes
│   ├── Data/ContextDb.cs                 # Conexão com banco via Dapper
│   ├── Repository/
│   │   └── ProductRepository.cs          # GetPendingAsync, GetApprovedAsync, UpdateAsync
│   ├── Controllers/
│   │   └── PromocoesController.cs        # GET /api/promocoes, threshold
│   ├── Service/
│   │   ├── ScraperService.cs             # Chama a API Python
│   │   ├── ValidacaoService.cs           # Cálculo e classificação
│   │   └── ScheduleService.cs            # Agendamento dos jobs no Hangfire
│   └── appsettings.json                  # Connection strings
│
└── front_react/
    ├── Dockerfile
    ├── vite.config.ts                    # Plugin @tailwindcss/vite
    └── src/
        ├── App.tsx                       # Header, contador, grid, estados
        ├── components/PromocaoCard.tsx   # Card com imagem, preços e CTA
        ├── services/api.ts               # Fetch + conversão PascalCase → camelCase
        ├── types/promocao.ts             # Tipagem da Promocao
        └── index.css                     # @import "tailwindcss"
```

---

## Pacotes / Dependências

### .NET 10
| Pacote                    | Uso                          |
|---------------------------|------------------------------|
| Dapper                    | Micro-ORM para acesso a dados |
| Hangfire + AspNetCore     | Agendamento de jobs           |
| Hangfire.SqlServer        | Storage do Hangfire           |
| Microsoft.Data.SqlClient  | Driver SQL Server             |
| Microsoft.AspNetCore.OpenApi | OpenAPI nativo do .NET 10  |
| Swashbuckle.AspNetCore    | Swagger UI                    |

### React
| Pacote                 | Uso                               |
|------------------------|-----------------------------------|
| react / react-dom      | UI                                |
| typescript             | Tipagem estática                  |
| vite                   | Dev server / build                |
| tailwindcss            | Estilização utilitária            |
| @tailwindcss/vite      | Integração Tailwind v4 com Vite   |

### Python
| Pacote      | Uso                                |
|-------------|------------------------------------|
| playwright  | Scraping de páginas dinâmicas      |
| fastapi     | Exposição do endpoint `/scrape`    |
| pyodbc      | Conexão com SQL Server             |

---

## Endpoint público

### `GET /api/promocoes`

Retorna as promoções aprovadas, ordenadas pelo maior desconto.

**Response (200 OK):**
```json
[
  {
    "Id": 12,
    "Sku": "B08XYZ",
    "Name": "Nome do produto",
    "PriceDe": 199.90,
    "PricePor": 79.90,
    "Link": "https://www.amazon.com.br/...",
    "ImageUrl": "https://m.media-amazon.com/images/...",
    "Status": "Approved",
    "Percentual": 0.6003
  }
]
```

O front converte automaticamente as chaves para camelCase no consumo.

---

## Como Rodar

### Via Docker Compose (recomendado)

Pré-requisitos: Docker + Docker Compose, e um SQL Server acessível em `host.docker.internal` com os bancos `HangfireDB` e `Sales_Bot` criados.

```bash
docker compose up --build
```

Isso sobe os três serviços:
- **scraper** → `http://localhost:8000`
- **back** (.NET 10 + Hangfire) → `http://localhost:5249`
- **front** (React) → `http://localhost:5173`
- Dashboard Hangfire → `http://localhost:5249/hangfire`

### Schema da tabela

Caso a coluna `ImageUrl` não exista:
```sql
USE Sales_Bot;
ALTER TABLE Promocoes ADD ImageUrl NVARCHAR(1000) NULL;
```

### Rodando local (sem Docker)

1. Subir a API Python: `uvicorn scraper_api:app --reload` (porta 8000)
2. Rodar o .NET: `dotnet run` na pasta `schedule_dotnet/schedule/` → API em `http://localhost:5249`
3. Rodar o React: `npm run dev` na pasta `front_react/` → UI em `http://localhost:5173`

---

## Regras de Negócio

- Produtos só são processados uma vez por ciclo (status sai de `Pending`)
- Se o scraper encontrar um SKU que já existe, atualiza preços e volta para `Pending`
- Divisão por zero é tratada: `PriceDe <= 0` resulta em `InvalidPrice`
- Precisão decimal garantida com `Math.Round(..., 4)` e tipo `decimal`
- O endpoint `/api/promocoes` retorna apenas `Status = 'Approved'`, ordenado por `Percentual DESC`
- Atualizações na UI são sob demanda (no carregamento da página ou via botão "Atualizar") — não há polling automático

---

## Roadmap

- [ ] Entrega automática das promoções aprovadas em grupos do **Telegram** e **WhatsApp**
- [ ] Expandir o scraper pra **Mercado Livre** e principais sites de livro do Brasil
- [ ] Histórico de variação de preço por SKU
