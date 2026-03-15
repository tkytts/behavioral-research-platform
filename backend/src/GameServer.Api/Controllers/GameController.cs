using GameServer.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Controllers;

[ApiController]
[Route("api/game")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;

    public GameController(IGameService gameService)
    {
        _gameService = gameService;
    }

    [HttpGet("confederate")]
    public IActionResult GetConfederate() =>
        Ok(_gameService.State.ConfederateName ?? string.Empty);
}
