using GameServer.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SuggestionsController : ControllerBase
{
    private readonly ISuggestionRepository _suggestionRepository;

    public SuggestionsController(ISuggestionRepository suggestionRepository)
    {
        _suggestionRepository = suggestionRepository;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IReadOnlyList<string>>>> GetSuggestions()
    {
        var data = await _suggestionRepository.GetAllAsync();
        return Ok(data);
    }
}
