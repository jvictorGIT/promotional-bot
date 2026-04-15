using System.Data;
using Microsoft.Data.SqlClient;

namespace schedule.Data;

public class ContextDb
{
    private readonly string _connectionString;

    public ContextDb(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("MainConnection")
            ?? throw new InvalidOperationException("Connection string 'MainConnection' not found.");
    }

    public IDbConnection CreateConnection()
        => new SqlConnection(_connectionString);
}
