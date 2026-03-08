using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace GameServer.Api.Controllers;

/// <summary>
/// API controller for accessing game blocks.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class BlocksController : ControllerBase
{
    private readonly IBlockRepository _blockRepository;
    private readonly IGameService _gameService;

    public BlocksController(IBlockRepository blockRepository, IGameService gameService)
    {
        _blockRepository = blockRepository;
        _gameService = gameService;
    }

    /// <summary>
    /// Gets all available blocks.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Block>>> GetBlocks()
    {
        var blocks = await _blockRepository.GetAllAsync();
        return Ok(blocks);
    }

    /// <summary>
    /// Gets answer suggestions for all blocks.
    /// </summary>
    [HttpGet("/api/suggestions")]
    public async Task<ActionResult<IReadOnlyList<IReadOnlyList<string>>>> GetSuggestions()
    {
        var path = "Resources/suggestions.json";
        if (!System.IO.File.Exists(path))
            return Ok(Array.Empty<string[]>());

        var json = await System.IO.File.ReadAllTextAsync(path);
        var data = JsonSerializer.Deserialize<List<List<string>>>(json) ?? new();
        return Ok(data);
    }

    /// <summary>
    /// Gets the current user/participant name.
    /// </summary>
    [HttpGet("/api/currentUser")]
    public ActionResult<string?> GetCurrentUser()
    {
        var participantName = JsonSerializer.Serialize(_gameService.State.ParticipantName);
        return Ok(participantName);
    }
}
