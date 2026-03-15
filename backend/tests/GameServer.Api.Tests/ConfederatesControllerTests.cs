using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace GameServer.Api.Tests;

public class ConfederatesControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ConfederatesControllerTests(WebApplicationFactory<Program> factory)
    {
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
        var response = await _client.GetAsync("/api/scripts?order=1");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetScript_ReturnsNotFound_WhenOrderDoesNotExist()
    {
        var response = await _client.GetAsync("/api/scripts?order=999");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
