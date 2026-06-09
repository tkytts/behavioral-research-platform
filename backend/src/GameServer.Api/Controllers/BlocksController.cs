using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Controllers;

/// <summary>
/// API controller for accessing game blocks.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class BlocksController : ControllerBase
{
    private readonly IBlockRepository _blockRepository;

    public BlocksController(IBlockRepository blockRepository)
    {
        _blockRepository = blockRepository;
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
}
