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
    public async Task OnTimeout_SavesTelemetryEvent_WithAction_Answer_And_ResolutionType()
    {
        // Arrange
        var tcs = new TaskCompletionSource<TelemetryEvent>(TaskCreationOptions.RunContinuationsAsynchronously);
        _telemetryRepository.SaveAsync(Arg.Any<TelemetryEvent>())
            .Returns(ci => { tcs.TrySetResult(ci.Arg<TelemetryEvent>()); return Task.CompletedTask; });
        // Reference discarded intentionally — the lambda registered via OnTimeout+= is what
        // survives (held by NSubstitute's event list); the service instance itself is not
        // rooted and can be collected, but the lambda fires synchronously before any GC opportunity.
        _ = new TimerBroadcastService(_timerService, _gameService, _telemetryRepository, _hubContext);

        // Act
        _timerService.OnTimeout += Raise.Event<Action>();

        // Assert
        var evt = await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        using (new FluentAssertions.Execution.AssertionScope())
        {
            evt.Action.Should().Be(TelemetryAction.GameResolved);
            evt.Answer.Should().Be("42");
            evt.Resolution.Should().Be("AP");
        }
    }

    [Fact]
    public async Task OnTimeout_NullTeamAnswer_SavesTelemetryWithNullAnswer()
    {
        // Arrange
        _gameService.State.TeamAnswer = null;
        var tcs = new TaskCompletionSource<TelemetryEvent>(TaskCreationOptions.RunContinuationsAsynchronously);
        _telemetryRepository.SaveAsync(Arg.Any<TelemetryEvent>())
            .Returns(ci => { tcs.TrySetResult(ci.Arg<TelemetryEvent>()); return Task.CompletedTask; });
        // Reference discarded intentionally — the lambda registered via OnTimeout+= is what
        // survives (held by NSubstitute's event list); the service instance itself is not
        // rooted and can be collected, but the lambda fires synchronously before any GC opportunity.
        _ = new TimerBroadcastService(_timerService, _gameService, _telemetryRepository, _hubContext);

        // Act
        _timerService.OnTimeout += Raise.Event<Action>();

        // Assert
        var evt = await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        evt.Answer.Should().BeNull();
    }
}
