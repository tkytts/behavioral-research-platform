using GameServer.Application.DTOs;
using GameServer.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Controllers;

[ApiController]
[Route("api/game")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;
    private readonly ITimerService _timerService;
    private readonly IWebHostEnvironment _env;

    public GameController(IGameService gameService, ITimerService timerService, IWebHostEnvironment env)
    {
        _gameService = gameService;
        _timerService = timerService;
        _env = env;
    }

    [HttpGet("confederate")]
    public IActionResult GetConfederate() =>
        Ok(_gameService.State.ConfederateName ?? string.Empty);

    [HttpGet("/api/currentUser")]
    public ActionResult<CurrentUserDto> GetCurrentUser() =>
        Ok(new CurrentUserDto(_gameService.State.ParticipantName));

    [HttpPost("reset")]
    public IActionResult Reset()
    {
        if (!_env.IsDevelopment())
            return NotFound();

        _gameService.State.Reset();
        _timerService.Stop();
        _timerService.Reset();
        return Ok();
    }
}
