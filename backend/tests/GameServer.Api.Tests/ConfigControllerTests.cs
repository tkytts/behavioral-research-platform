using System.Collections.Generic;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace GameServer.Api.Tests;

public class ConfigControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ConfigControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetFeatures_ReturnsOkStatus()
    {
        var response = await _client.GetAsync("/api/config/features");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetFeatures_ReturnsCamelCaseJson()
    {
        var response = await _client.GetAsync("/api/config/features");
        var json = await response.Content.ReadAsStringAsync();
        json.Should().Contain("dashboard");
        json.Should().Contain("scriptsModal");
    }

    [Fact]
    public async Task GetFeatures_DefaultsHaveActiveTrue()
    {
        var response = await _client.GetAsync("/api/config/features");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("dashboard").GetProperty("active").GetBoolean().Should().BeTrue();
        body.GetProperty("scriptsModal").GetProperty("active").GetBoolean().Should().BeTrue();
    }

    [Fact]
    public async Task GetFeatures_DefaultTypingWpmIs60()
    {
        var response = await _client.GetAsync("/api/config/features");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("scriptsModal").GetProperty("typingWpm").GetInt32().Should().Be(60);
    }

    [Fact]
    public async Task GetFeatures_WhenFeaturesSectionAbsentFromConfig_ReturnsDefaults()
    {
        var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(b =>
                b.ConfigureAppConfiguration((_, cfg) =>
                    cfg.AddInMemoryCollection(new Dictionary<string, string?>())));
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/config/features");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        body.GetProperty("dashboard").GetProperty("active").GetBoolean().Should().BeTrue();
        body.GetProperty("scriptsModal").GetProperty("typingWpm").GetInt32().Should().Be(60);
    }
}
