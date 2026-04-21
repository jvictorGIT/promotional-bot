using Microsoft.AspNetCore.Mvc;
using schedule.Repository;

namespace schedule.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PromocoesController : ControllerBase
{
    private readonly ProductRepository _repository;

    public PromocoesController(ProductRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<IActionResult> GetApproved()
    {
        var promocoes = await _repository.GetApprovedAsync();
        return Ok(promocoes);
    }
}
