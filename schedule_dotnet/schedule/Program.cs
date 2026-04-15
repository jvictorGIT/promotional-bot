using Hangfire;
using Hangfire.SqlServer;
using schedule.Data;
using schedule.Repository;
using schedule.Service;

var builder = WebApplication.CreateBuilder(args);

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

app.UseHttpsRedirection();
app.UseHangfireDashboard("/hangfire");

var scheduler = app.Services.GetRequiredService<ScheduleService>();
scheduler.AgendarJobs();

app.Run();
