using FluentAssertions;
using GameServer.Api.Hubs;
using GameServer.Api.Services;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using GameServer.Domain.Constants;
using GameServer.Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using NSubstitute;
using Xunit;

namespace GameServer.Api.Tests;

public class TimerBroadcastServiceTests
{
    private readonly ITimerService _timerService;
    private readonly IGameService _gameService;
    private readonly ITelemetryRepository _telemetryRepository;
    private readonly IHubContext<GameHub> _hubContext;

    public TimerBroadcastServiceTests()
    {
        _timerService = Substitute.For<ITimerService>();
        _gameService = Substitute.For<IGameService>();
        _telemetryRepository = Substitute.For<ITelemetryRepository>();
        _hubContext = Substitute.For<IHubContext<GameHub>>();

        var clients = Substitute.For<IHubClients>();
        var clientProxy = Substitute.For<IClientProxy>();
        _hubContext.Clients.Returns(clients);
        clients.All.Returns(clientProxy);

        var state = new GameState
        {
            ParticipantName = "Alice",
            ConfederateName = "Bob",
            PendingResolutionType = GameResolutionType.AP,
            TeamAnswer = "42"
        };
        _gameService.State.Returns(state);
        _gameService.ResolveGame(Arg.Any<GameResolutionType>(), Arg.Any<string?>())
            .Returns(new GameResolution
            {
                IsAnswerCorrect = true,
                PointsAwarded = 100,
                CurrentScore = 100,
                TeamAnswer = "42"
            });
    }

    [Fact]
    public async Task OnTimeout_SavesTelemetryWithGameResolvedAction()
    {
        // Arrange
        _ = new TimerBroadcastService(_timerService, _gameService, _telemetryRepository, _hubContext);

        // Act
        _timerService.OnTimeout += Raise.Event<Action>();
        await Task.Delay(100);

        // Assert
        await _telemetryRepository.Received(1).SaveAsync(Arg.Is<TelemetryEvent>(e =>
            e.Action == TelemetryAction.GameResolved));
    }

    [Fact]
    public async Task OnTimeout_IncludesTeamAnswerInTelemetry()
    {
        // Arrange
        _ = new TimerBroadcastService(_timerService, _gameService, _telemetryRepository, _hubContext);

        // Act
        _timerService.OnTimeout += Raise.Event<Action>();
        await Task.Delay(100);

        // Assert
        await _telemetryRepository.Received(1).SaveAsync(Arg.Is<TelemetryEvent>(e =>
            e.Answer == "42"));
    }

    [Fact]
    public async Task OnTimeout_IncludesResolutionTypeInTelemetry()
    {
        // Arrange
        _ = new TimerBroadcastService(_timerService, _gameService, _telemetryRepository, _hubContext);

        // Act
        _timerService.OnTimeout += Raise.Event<Action>();
        await Task.Delay(100);

        // Assert
        await _telemetryRepository.Received(1).SaveAsync(Arg.Is<TelemetryEvent>(e =>
            e.Resolution == "AP"));
    }

    [Fact]
    public async Task OnTimeout_NullTeamAnswer_SavesTelemetryWithNullAnswer()
    {
        // Arrange
        _gameService.State.TeamAnswer = null;
        _ = new TimerBroadcastService(_timerService, _gameService, _telemetryRepository, _hubContext);

        // Act
        _timerService.OnTimeout += Raise.Event<Action>();
        await Task.Delay(100);

        // Assert
        await _telemetryRepository.Received(1).SaveAsync(Arg.Is<TelemetryEvent>(e =>
            e.Answer == null));
    }
}
