

namespace schedule.Service
{
    public class ScraperService
    {
        private readonly HttpClient _http;

        public ScraperService(HttpClient http)
        {
            _http = http;
        }

        public async Task Executar()
        {
            var response = await _http.GetAsync("http://127.0.0.1:8000/scrape");

            if (!response.IsSuccessStatusCode)
                throw new Exception("Erro ao chamar API Python");

            var content = await response.Content.ReadAsStringAsync();

            Console.WriteLine(content);
        }
        

    }


}