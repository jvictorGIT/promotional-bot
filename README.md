# Schedule Sales Bot

## Objetivo

Sistema que monitora promoções de e-commerce, coleta dados via scraping (Python), processa/classifica os descontos automaticamente (.NET 8) e exibe as promoções aprovadas em uma interface web (React + Tailwind), de forma recorrente e escalável.

---

## Arquitetura

O projeto é dividido em três partes que trabalham juntas:

### 1. Scraper (Python - FastAPI)
- Roda em `http://127.0.0.1:8000`
- Faz scraping de produtos em e-commerces
- Insere/atualiza os dados na tabela `Promocoes` do banco `Sales_Bot`
- Todos os registros entram com `Status = 'Pending'`
- Se o SKU já existe, atualiza preços e volta o status para `Pending` (permite reavaliação)
- Limpa preços vindos como string (`"R$ 89,90"` → `89.90`) antes de salvar
- Captura também a `ImageUrl` do produto

### 2. Processador + API (.NET 8 - Hangfire)
- Busca registros com `Status = 'Pending'` na tabela `Promocoes`
- Calcula o percentual de desconto: `1 - (PricePor / PriceDe)`
- Classifica:
  - `>= 50%` → `Status = "Approved"`
  - `< 50%` → `Status = "LowDiscount"`
  - `PriceDe = 0` → `Status = "InvalidPrice"`
- Atualiza `Status` e `Percentual` no banco
- Exibe resultado no terminal
- Expõe o endpoint público `GET /api/promocoes` com as promoções aprovadas, ordenadas pelo maior desconto
- CORS habilitado para o front-end consumir os dados

### 3. Front-end (React + Vite + Tailwind v4)
- Interface moderna e responsiva em `http://localhost:5173`
- Grid de cards com: imagem do produto, nome, preço "De" (riscado), preço "Por" em destaque, badge de desconto e botão "Ir para a loja"
- Contador de produtos em promoção no topo da página
- Estados de loading, erro (com retry) e empty state
- Conversão automática de PascalCase (C#) para camelCase (JS) no consumo da API

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
├── scraper_python/
│   └── api/
│       ├── scraper.py                 # Playwright + Amazon
│       ├── scraper_api.py             # FastAPI (GET /scrape)
│       └── database/mainDb.py         # Persistência pyodbc
│
├── schedule_dotnet/schedule/
│   ├── Program.cs                     # DI, Hangfire, CORS, MapControllers
│   ├── Models/jsonModel.cs            # Model da tabela Promocoes
│   ├── Data/ContextDb.cs              # Conexão com banco via Dapper
│   ├── Repository/
│   │   └── ProductRepository.cs       # GetPendingAsync, GetApprovedAsync, UpdateAsync
│   ├── Controllers/
│   │   └── PromocoesController.cs     # GET /api/promocoes
│   ├── Service/
│   │   ├── ScraperService.cs          # Chama a API Python
│   │   ├── ValidacaoService.cs        # Cálculo e classificação
│   │   └── ScheduleService.cs         # Agendamento dos jobs no Hangfire
│   └── appsettings.json               # Connection strings
│
└── front_react/
    ├── src/
    │   ├── App.jsx                    # Header, contador, grid, estados
    │   ├── components/PromocaoCard.jsx # Card com imagem, preços e CTA
    │   ├── services/api.js            # Fetch + conversão PascalCase → camelCase
    │   └── index.css                  # @import "tailwindcss"
    └── vite.config.js                 # Plugin @tailwindcss/vite
```

---

## Pacotes / Dependências

### .NET
| Pacote                    | Uso                          |
|---------------------------|------------------------------|
| Dapper                    | Micro-ORM para acesso a dados |
| Hangfire + AspNetCore     | Agendamento de jobs           |
| Hangfire.SqlServer        | Storage do Hangfire           |
| Microsoft.Data.SqlClient  | Driver SQL Server             |
| Swashbuckle.AspNetCore    | Swagger / OpenAPI             |

### React
| Pacote                 | Uso                               |
|------------------------|-----------------------------------|
| react / react-dom      | UI                                |
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

1. Garantir que o SQL Server está ativo com os bancos `HangfireDB` e `Sales_Bot`.
2. Aplicar o schema da tabela (caso a coluna `ImageUrl` não exista):
   ```sql
   USE Sales_Bot;
   ALTER TABLE Promocoes ADD ImageUrl NVARCHAR(1000) NULL;
   ```
3. Subir a API Python: `uvicorn scraper_api:app --reload` (porta 8000)
4. Rodar o .NET: `dotnet run` na pasta `schedule_dotnet/schedule/` → API em `http://localhost:5249`
5. Rodar o React: `npm run dev` na pasta `front_react/` → UI em `http://localhost:5173`
6. Dashboard Hangfire: `http://localhost:5249/hangfire`

---

## Regras de Negócio

- Produtos só são processados uma vez por ciclo (status sai de `Pending`)
- Se o scraper encontrar um SKU que já existe, atualiza preços e volta para `Pending`
- Divisão por zero é tratada: `PriceDe <= 0` resulta em `InvalidPrice`
- Precisão decimal garantida com `Math.Round(..., 4)` e tipo `decimal`
- O endpoint `/api/promocoes` retorna apenas `Status = 'Approved'`, ordenado por `Percentual DESC`
- Atualizações na UI são sob demanda (no carregamento da página ou via botão "Atualizar") — não há polling automático
