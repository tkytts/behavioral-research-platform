using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace GameServer.Api.Tests;

public class BlocksControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public BlocksControllerTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetBlocks_ReturnsOkStatus()
    {
        // Act
        var response = await _client.GetAsync("/api/blocks");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetCurrentUser_ReturnsOkStatus()
    {
        // Act
        var response = await _client.GetAsync("/api/currentUser");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetSuggestions_ReturnsOkStatus()
    {
        // Act
        var response = await _client.GetAsync("/api/suggestions");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
