

namespace schedule.Service
{
    public class ScraperService
    {
        private readonly HttpClient _http;
        private readonly string _scraperUrl;

        public ScraperService(HttpClient http, IConfiguration configuration)
        {
            _http = http;
            _scraperUrl = configuration["ScraperSettings:Url"] ?? "http://127.0.0.1:8000";
        }

        public async Task Executar()
        {
            var response = await _http.GetAsync($"{_scraperUrl}/scrape");

            if (!response.IsSuccessStatusCode)
                throw new Exception("Erro ao chamar API Python");

            var content = await response.Content.ReadAsStringAsync();

            Console.WriteLine(content);
        }
        

    }


}