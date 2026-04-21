using schedule.Repository;

namespace schedule.Service;

public class ValidacaoService
{
    private readonly ProductRepository _repository;
    private readonly ConfiguracaoRepository _configuracao;

    public ValidacaoService(ProductRepository repository, ConfiguracaoRepository configuracao)
    {
        _repository = repository;
        _configuracao = configuracao;
    }

    public async Task Validar()
    {
        var valorThreshold = await _configuracao.GetAsync("threshold_percentual");
        var threshold = decimal.TryParse(valorThreshold, System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture, out var parsed)
            ? parsed
            : 0.50m;

        var pendentes = await _repository.GetPendingAsync();

        foreach (var item in pendentes)
        {
            if (item.PriceDe <= 0)
            {
                item.Status = "InvalidPrice";
                item.Percentual = 0;
            }
            else
            {
                item.Percentual = Math.Round(1m - (item.PricePor / item.PriceDe), 4);
                item.Status = item.Percentual >= threshold ? "Approved" : "LowDiscount";
            }

            await _repository.UpdateAsync(item);

            Console.WriteLine($"{item.Name,-30} | De: {item.PriceDe,10:C2} | Por: {item.PricePor,10:C2} | {item.Percentual,7:P2} | {item.Status}");
        }

        if (!pendentes.Any())
            Console.WriteLine("Nenhum registro pendente encontrado.");
    }
}
