using Hangfire;
using Microsoft.AspNetCore.Mvc;
using schedule.Repository;
using schedule.Service;

namespace schedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfiguracoesController : ControllerBase
{
    private readonly ConfiguracaoRepository _configuracao;
    private readonly ProductRepository _products;
    private readonly IBackgroundJobClient _jobClient;

    public ConfiguracoesController(
        ConfiguracaoRepository configuracao,
        ProductRepository products,
        IBackgroundJobClient jobClient)
    {
        _configuracao = configuracao;
        _products = products;
        _jobClient = jobClient;
    }

    [HttpGet("threshold")]
    public async Task<IActionResult> GetThreshold()
    {
        var valor = await _configuracao.GetAsync("threshold_percentual");
        if (valor is null)
            return NotFound();

        return Ok(new { threshold = decimal.Parse(valor, System.Globalization.CultureInfo.InvariantCulture) });
    }

    [HttpPut("threshold")]
    public async Task<IActionResult> UpdateThreshold([FromBody] ThresholdRequest request)
    {
        if (request.Threshold < 0 || request.Threshold > 1)
            return BadRequest("O threshold deve estar entre 0 e 1.");

        var valor = request.Threshold.ToString("F4", System.Globalization.CultureInfo.InvariantCulture);
        await _configuracao.UpsertAsync("threshold_percentual", valor);
        await _products.ResetToValidationAsync();
        _jobClient.Enqueue<ValidacaoService>(v => v.Validar());

        return Ok(new { threshold = request.Threshold });
    }
}

public record ThresholdRequest(decimal Threshold);
