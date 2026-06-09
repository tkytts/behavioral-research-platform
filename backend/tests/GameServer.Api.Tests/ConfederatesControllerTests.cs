using System.Net;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace GameServer.Api.Tests;

public class ConfederatesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public ConfederatesControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetConfederates_ReturnsOkStatus()
    {
        var response = await _client.GetAsync("/api/confederates");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetScript_ReturnsOkStatus_WhenOrderExists()
    {
        using var factory = _factory.WithWebHostBuilder(builder =>
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IScriptRepository>();
                services.AddSingleton<IScriptRepository>(new TestScriptRepository());
            }));
        using var client = factory.CreateClient();
        var response = await client.GetAsync("/api/scripts?order=1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetScript_ReturnsNotFound_WhenOrderDoesNotExist()
    {
        var response = await _client.GetAsync("/api/scripts?order=999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    private sealed class TestScriptRepository : IScriptRepository
    {
        public Task<Script?> GetByOrderAsync(int order)
        {
            if (order != 1)
                return Task.FromResult<Script?>(null);

            return Task.FromResult<Script?>(new Script
            {
                Orders = [1],
                MessageGroups = new Dictionary<string, MessageGroup>
                {
                    ["start_conversation"] = new() { Messages = ["hello"] }
                },
                Resolutions = [new ScriptResolution { Problem = 0, Resolution = "AP" }]
            });
        }
    }
}
