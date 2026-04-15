using Hangfire;

namespace schedule.Service;

public class ScheduleService
{
    private readonly IRecurringJobManager _recurringJobManager;

    public ScheduleService(IRecurringJobManager recurringJobManager)
    {
        _recurringJobManager = recurringJobManager;
    }

    public void AgendarJobs()
    {
        _recurringJobManager.AddOrUpdate<ScraperService>(
            "scrape-job",
            scraper => scraper.Executar(),
            "*/15 * * * *"
        );

        _recurringJobManager.AddOrUpdate<ValidacaoService>(
            "validacao-job",
            validacao => validacao.Validar(),
            "*/16 * * * *"
        );
    }
}
