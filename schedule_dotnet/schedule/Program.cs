using Hangfire;
using Hangfire.SqlServer;
using schedule.Data;
using schedule.Repository;
using schedule.Service;

var builder = WebApplication.CreateBuilder(args);

const string CorsPolicy = "AllowFrontend";

builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

builder.Services.AddSingleton<ContextDb>();
builder.Services.AddTransient<ProductRepository>();
builder.Services.AddTransient<ScraperService>();
builder.Services.AddTransient<ValidacaoService>();
builder.Services.AddTransient<ScheduleService>();

builder.Services.AddHangfire(config => config
    .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
    .UseSimpleAssemblyNameTypeSerializer()
    .UseRecommendedSerializerSettings()
    .UseSqlServerStorage(builder.Configuration.GetConnectionString("DefaultConnection"), new SqlServerStorageOptions
    {
        CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
        SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
        QueuePollInterval = TimeSpan.Zero,
        UseRecommendedIsolationLevel = true,
        DisableGlobalLocks = true
    }));

builder.Services.AddHangfireServer();

var app = builder.Build();

app.UseCors(CorsPolicy);
app.UseHangfireDashboard("/hangfire");
app.MapControllers();

var scheduler = app.Services.GetRequiredService<ScheduleService>();
scheduler.AgendarJobs();

app.Run();
