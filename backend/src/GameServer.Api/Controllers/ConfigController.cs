using GameServer.Application;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace GameServer.Api.Controllers;

[ApiController]
[Route("api/config")]
public class ConfigController : ControllerBase
{
    private readonly FeatureSettings _features;

    public ConfigController(IOptions<FeatureSettings> features)
    {
        _features = features.Value;
    }

    [HttpGet("features")]
    public IActionResult GetFeatures() => Ok(_features);
}
