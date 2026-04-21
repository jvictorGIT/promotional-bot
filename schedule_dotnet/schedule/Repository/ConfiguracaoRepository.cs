using Dapper;
using schedule.Data;

namespace schedule.Repository;

public class ConfiguracaoRepository
{
    private readonly ContextDb _context;

    public ConfiguracaoRepository(ContextDb context)
    {
        _context = context;
    }

    public async Task<string?> GetAsync(string chave)
    {
        using var connection = _context.CreateConnection();
        const string sql = "SELECT Valor FROM Configuracoes WHERE Chave = @Chave";
        return await connection.QueryFirstOrDefaultAsync<string>(sql, new { Chave = chave });
    }

    public async Task UpsertAsync(string chave, string valor)
    {
        using var connection = _context.CreateConnection();
        const string sql = @"
            IF EXISTS (SELECT 1 FROM Configuracoes WHERE Chave = @Chave)
                UPDATE Configuracoes SET Valor = @Valor WHERE Chave = @Chave
            ELSE
                INSERT INTO Configuracoes (Chave, Valor) VALUES (@Chave, @Valor)";
        await connection.ExecuteAsync(sql, new { Chave = chave, Valor = valor });
    }
}
