# Schedule Sales Bot

## Objetivo

Sistema que monitora promoções de e-commerce, coleta dados via scraping (Python) e processa/classifica os descontos automaticamente (.NET 8), de forma recorrente e escalável.

---

## Arquitetura

O projeto é dividido em duas partes que trabalham juntas:

### 1. Scraper (Python - FastAPI)
- Roda em `http://127.0.0.1:8000`
- Faz scraping de produtos em e-commerces
- Insere/atualiza os dados na tabela `Promocoes` do banco `Sales_Bot`
- Todos os registros entram com `Status = 'Pending'`
- Se o SKU já existe, atualiza preços e volta o status para `Pending` (permite reavaliação)
- Limpa preços vindos como string (`"R$ 89,90"` → `89.90`) antes de salvar

### 2. Processador (.NET 8 - Hangfire)
- Busca registros com `Status = 'Pending'` na tabela `Promocoes`
- Calcula o percentual de desconto: `1 - (PricePor / PriceDe)`
- Classifica:
  - `>= 50%` → `Status = "Approved"`
  - `< 50%` → `Status = "LowDiscount"`
  - `PriceDe = 0` → `Status = "InvalidPrice"`
- Atualiza `Status` e `Percentual` no banco
- Exibe resultado no terminal

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
```

---

## Banco de Dados (SQL Server)

- **Hangfire**: banco `HangfireDB` (gerenciado pelo Hangfire)
- **Dados**: banco `Sales_Bot`, tabela `Promocoes`

### Tabela Promocoes

| Coluna     | Tipo           | Descrição                              |
|------------|----------------|----------------------------------------|
| Id         | INT (PK)       | Auto-incremento                        |
| Sku        | INT            | Identificador do produto               |
| Name       | NVARCHAR       | Nome do produto                        |
| PriceDe    | DECIMAL(18,2)  | Preço original ("de")                  |
| PricePor   | DECIMAL(18,2)  | Preço com desconto ("por")             |
| Link       | NVARCHAR       | URL do produto                         |
| Status     | NVARCHAR       | Pending / Approved / LowDiscount / InvalidPrice |
| Percentual | DECIMAL(18,4)  | Percentual de desconto calculado       |

### Connection Strings (appsettings.json)

- `DefaultConnection` → `HangfireDB` (usado pelo Hangfire)
- `MainConnection` → `Sales_Bot` (usado pelo ProductRepository via Dapper)

---

## Estrutura do Projeto .NET

```
schedule/
├── Program.cs                      # DI, Hangfire, inicialização
├── Models/
│   └── jsonModel.cs                # Model da tabela Promocoes
├── Data/
│   └── ContextDb.cs                # Conexão com banco via Dapper
├── Repository/
│   └── ProductRepository.cs        # Queries: GetPendingAsync, UpdateAsync
├── Service/
│   ├── ScraperService.cs           # Chama a API Python (GET /scrape)
│   ├── ValidacaoService.cs         # Lógica de cálculo e classificação
│   └── ScheduleService.cs          # Agendamento dos jobs no Hangfire
└── appsettings.json                # Connection strings e config
```

---

## Pacotes NuGet

| Pacote                    | Uso                          |
|---------------------------|------------------------------|
| Dapper                    | Micro-ORM para acesso a dados |
| Hangfire + AspNetCore     | Agendamento de jobs           |
| Hangfire.SqlServer        | Storage do Hangfire           |
| Microsoft.Data.SqlClient  | Driver SQL Server             |

---

## Como Rodar

1. Garantir que o SQL Server está ativo com os bancos `HangfireDB` e `Sales_Bot`
2. Subir a API Python: `uvicorn main:app --reload` (porta 8000)
3. Rodar o .NET: `dotnet run` na pasta `schedule/`
4. Dashboard Hangfire: `https://localhost:{porta}/hangfire`

---

## Regras de Negócio

- Produtos só são processados uma vez por ciclo (status sai de `Pending`)
- Se o scraper encontrar um SKU que já existe, atualiza preços e volta para `Pending`
- Divisão por zero é tratada: `PriceDe <= 0` resulta em `InvalidPrice`
- Precisão decimal garantida com `Math.Round(..., 4)` e tipo `decimal`
