using GameServer.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Controllers;

/// <summary>
/// API controller for accessing confederates and scripts.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ConfederatesController : ControllerBase
{
    private readonly IConfederateRepository _confederateRepository;
    private readonly IScriptRepository _scriptRepository;

    public ConfederatesController(IConfederateRepository confederateRepository, IScriptRepository scriptRepository)
    {
        _confederateRepository = confederateRepository;
        _scriptRepository = scriptRepository;
    }

    /// <summary>
    /// Gets all confederates grouped by gender.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult> GetConfederates()
    {
        var female = await _confederateRepository.GetFemaleAsync();
        var male = await _confederateRepository.GetMaleAsync();
        return Ok(new { female, male });
    }

    /// <summary>
    /// Gets the script for the given confederate order.
    /// </summary>
    [HttpGet("/api/scripts")]
    public async Task<ActionResult> GetScript([FromQuery] int order)
    {
        var script = await _scriptRepository.GetByOrderAsync(order);
        if (script is null)
            return NotFound();
        return Ok(script);
    }
}
