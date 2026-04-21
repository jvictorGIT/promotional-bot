using Dapper;
using schedule.Data;

namespace schedule.Repository;

public class ProductRepository
{
    private readonly ContextDb _context;

    public ProductRepository(ContextDb context)
    {
        _context = context;
    }

    public async Task<IEnumerable<jsonModel>> GetPendingAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = "SELECT Id, Sku, Name, PriceDe, PricePor, Link, Status, Percentual FROM Promocoes WHERE Status = @Status";

        return await connection.QueryAsync<jsonModel>(sql, new { Status = "Pending" });
    }

    public async Task<IEnumerable<jsonModel>> GetApprovedAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = @"SELECT Id, Sku, Name, PriceDe, PricePor, Link, ImageUrl, Status, Percentual
                             FROM Promocoes
                             WHERE Status = @Status
                             ORDER BY Percentual DESC";

        return await connection.QueryAsync<jsonModel>(sql, new { Status = "Approved" });
    }

    public async Task UpdateAsync(jsonModel item)
    {
        using var connection = _context.CreateConnection();

        const string sql = "UPDATE Promocoes SET Status = @Status, Percentual = @Percentual WHERE Id = @Id";

        await connection.ExecuteAsync(sql, new { item.Status, item.Percentual, item.Id });
    }

    public async Task ResetToValidationAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = "UPDATE Promocoes SET Status = 'Pending' WHERE Status IN ('Approved', 'LowDiscount')";

        await connection.ExecuteAsync(sql);
    }
}
