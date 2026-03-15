using FluentAssertions;
using GameServer.Application;
using GameServer.Application.DTOs;
using GameServer.Domain.Constants;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace GameServer.Api.Tests;

public class GameHubTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private HubConnection? _connection;

    public GameHubTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    public async Task InitializeAsync()
    {
        var client = _factory.CreateClient();
        _connection = new HubConnectionBuilder()
            .WithUrl(
                $"{client.BaseAddress}api/gamehub",
                options => options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler())
            .Build();

        await _connection.StartAsync();
    }

    public async Task DisposeAsync()
    {
        if (_connection is not null)
        {
            await _connection.DisposeAsync();
        }
    }

    [Fact]
    public async Task Connection_CanBeEstablished()
    {
        // Assert
        _connection!.State.Should().Be(HubConnectionState.Connected);
    }

    [Fact]
    public async Task SendMessage_BroadcastsToAll()
    {
        // Arrange
        ChatMessageDto? receivedMessage = null;
        _connection!.On<ChatMessageDto>("ReceiveMessage", msg => receivedMessage = msg);

        // Act
        await _connection.InvokeAsync("SendMessage", new ChatMessageDto("TestUser", "Hello!"));
        await Task.Delay(100); // Allow time for message to arrive

        // Assert
        receivedMessage.Should().NotBeNull();
        receivedMessage!.User.Should().Be("TestUser");
        receivedMessage.Text.Should().Be("Hello!");
    }

    [Fact]
    public async Task StartGame_BroadcastsStatusUpdate()
    {
        // Arrange
        bool? gameStatus = null;
        _connection!.On<bool>("StatusUpdate", status => gameStatus = status);

        // Act
        await _connection.InvokeAsync("StartGame");
        await Task.Delay(100);

        // Assert
        gameStatus.Should().BeTrue();
    }

    [Fact]
    public async Task StopGame_BroadcastsStatusUpdate()
    {
        // Arrange
        bool? gameStatus = null;
        _connection!.On<bool>("StatusUpdate", status => gameStatus = status);

        // Act
        await _connection.InvokeAsync("StopGame");
        await Task.Delay(100);

        // Assert
        gameStatus.Should().BeFalse();
    }

    [Fact]
    public async Task ResetPoints_BroadcastsZeroScore()
    {
        // Arrange
        int? score = null;
        _connection!.On<int>("PointsUpdate", s => score = s);

        // Act
        await _connection.InvokeAsync("ResetPoints");
        await Task.Delay(100);

        // Assert
        score.Should().Be(0);
    }

    [Fact]
    public async Task SetConfederate_BroadcastsNewConfederate()
    {
        // Arrange
        string? confederate = null;
        _connection!.On<string>("NewConfederate", name => confederate = name);

        // Act
        await _connection.InvokeAsync("SetConfederate", "TestConfederate");
        await Task.Delay(100);

        // Assert
        confederate.Should().Be("TestConfederate");
    }

    [Fact]
    public async Task BlockFinished_BroadcastsNewConfederate_WithInterrupts()
    {
        // Arrange
        string? receivedConfederate = null;
        _connection!.On<string>("NewConfederate", name => receivedConfederate = name);

        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("TestUser", null, TelemetryAction.Interrupt, null));
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("TestUser", null, TelemetryAction.Interrupt, null));

        // Act
        await _connection.InvokeAsync("BlockFinished");
        await Task.Delay(100);

        // Assert
        receivedConfederate.Should().Be(string.Empty);
    }

    [Fact]
    public async Task BlockFinished_SavesBlockInterruptsTelemetry()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "IntegrationUser");

        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("IntegrationUser", null, TelemetryAction.Interrupt, null));
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("IntegrationUser", null, TelemetryAction.Interrupt, null));
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("IntegrationUser", null, TelemetryAction.Interrupt, null));

        // Act
        await _connection.InvokeAsync("BlockFinished");
        await Task.Delay(100);

        // Assert
        var settings = _factory.Services.GetRequiredService<IOptions<GameSettings>>().Value;
        var files = Directory.GetFiles(settings.LogPath, "*.csv");
        var allContent = await Task.WhenAll(files.Select(f => File.ReadAllTextAsync(f)));
        var combined = string.Concat(allContent);
        combined.Should().Contain(TelemetryAction.BlockInterrupts);
        combined.Should().Contain(",3,");
    }

    [Fact]
    public async Task SetAnswer_BroadcastsAnswerToClients()
    {
        // Arrange
        string? receivedAnswer = null;
        _connection!.On<string>("SetAnswer", answer => receivedAnswer = answer);

        // Act
        await _connection.InvokeAsync("SetAnswer", "42");
        await Task.Delay(100);

        // Assert
        receivedAnswer.Should().Be("42");
    }

    [Fact]
    public async Task SetAnswer_SavesTeamAnswerSetTelemetry()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "IntegrationUser");

        // Act
        await _connection.InvokeAsync("SetAnswer", "42");
        await Task.Delay(100);

        // Assert
        var settings = _factory.Services.GetRequiredService<IOptions<GameSettings>>().Value;
        var files = Directory.GetFiles(settings.LogPath, "*.csv");
        var allContent = await Task.WhenAll(files.Select(f => File.ReadAllTextAsync(f)));
        var combined = string.Concat(allContent);
        combined.Should().Contain(TelemetryAction.TeamAnswerSet);
        combined.Should().Contain(",,42");
    }

    [Fact]
    public async Task SetParticipantName_RoutesSubsequentTelemetryIntoSessionSubfolder()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "Alice");

        // Act
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("Alice", null, TelemetryAction.Edit, null));
        await Task.Delay(100);

        // Assert
        var settings = _factory.Services.GetRequiredService<IOptions<GameSettings>>().Value;
        var subfolders = Directory.GetDirectories(settings.LogPath, "Alice_*");
        subfolders.Should().NotBeEmpty();
        var files = Directory.GetFiles(subfolders[0], "*.csv");
        files.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Typing_NotifiesOtherClients()
    {
        // Arrange - Create second connection
        var client = _factory.CreateClient();
        var connection2 = new HubConnectionBuilder()
            .WithUrl(
                $"{client.BaseAddress}api/gamehub",
                options => options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler())
            .Build();
        await connection2.StartAsync();

        string? typingUser = null;
        connection2.On<string>("UserTyping", username => typingUser = username);

        // Act
        await _connection!.InvokeAsync("Typing", "User1");
        await Task.Delay(100);

        // Assert
        typingUser.Should().Be("User1");

        // Cleanup
        await connection2.DisposeAsync();
    }
}
