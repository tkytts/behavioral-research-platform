using FluentAssertions;
using GameServer.Api.Hubs;
using GameServer.Api.Services;
using GameServer.Application.DTOs;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using GameServer.Domain.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Xunit;

namespace GameServer.Api.Tests;

public class TimerBroadcastServiceTests
{
    private readonly ITimerService _timerService;
    private readonly IGameService _gameService;
    private readonly IHubContext<GameHub> _hubContext;
    private readonly IClientProxy _clientProxy;

    public TimerBroadcastServiceTests()
    {
        _timerService = Substitute.For<ITimerService>();
        _gameService = Substitute.For<IGameService>();
        _hubContext = Substitute.For<IHubContext<GameHub>>();

        var clients = Substitute.For<IHubClients>();
        _clientProxy = Substitute.For<IClientProxy>();
        _hubContext.Clients.Returns(clients);
        clients.All.Returns(_clientProxy);

        var state = new GameState
        {
            ParticipantName = "Alice",
            ConfederateName = "Bob",
            PendingResolutionType = GameResolutionType.AP,
            TeamAnswer = "42"
        };
        _gameService.State.Returns(state);
        _gameService.ResolvePendingGameAsync().Returns(new GameResolution
        {
            IsAnswerCorrect = true,
            PointsAwarded = 100,
            CurrentScore = 100,
            TeamAnswer = "42",
            ResolutionType = GameResolutionType.AP
        });
    }

    private TimerBroadcastService CreateSut() =>
        new TimerBroadcastService(_timerService, _gameService, _hubContext, NullLogger<TimerBroadcastService>.Instance);

    [Fact]
    public async Task StartAsync_RegistersOnTickAndOnTimeoutHandlers()
    {
        var sut = CreateSut();
        await sut.StartAsync(CancellationToken.None);

        _timerService.Received(1).OnTick += Arg.Any<Action<int>>();
        _timerService.Received(1).OnTimeout += Arg.Any<Action>();
    }

    [Fact]
    public async Task StopAsync_UnregistersHandlers()
    {
        var sut = CreateSut();
        await sut.StartAsync(CancellationToken.None);
        await sut.StopAsync(CancellationToken.None);

        _timerService.Received(1).OnTick -= Arg.Any<Action<int>>();
        _timerService.Received(1).OnTimeout -= Arg.Any<Action>();
    }

    [Fact]
    public async Task OnTick_BroadcastsTimerUpdate()
    {
        var sut = CreateSut();
        await sut.StartAsync(CancellationToken.None);

        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        _clientProxy.SendCoreAsync("TimerUpdate", Arg.Any<object?[]?>(), Arg.Any<CancellationToken>())
            .Returns(ci => { tcs.TrySetResult(true); return Task.CompletedTask; });

        _timerService.OnTick += Raise.Event<Action<int>>(42);

        await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await _clientProxy.Received(1).SendCoreAsync("TimerUpdate", Arg.Is<object?[]?>(a => (int)a![0]! == 42), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task OnTimeout_BroadcastsGameResolved()
    {
        var sut = CreateSut();
        await sut.StartAsync(CancellationToken.None);

        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        _clientProxy.SendCoreAsync("GameResolved", Arg.Any<object?[]?>(), Arg.Any<CancellationToken>())
            .Returns(ci => { tcs.TrySetResult(true); return Task.CompletedTask; });

        _timerService.OnTimeout += Raise.Event<Action>();

        await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await _gameService.Received(1).ResolvePendingGameAsync();
        await _clientProxy.Received(1).SendCoreAsync("GameResolved",
            Arg.Is<object?[]?>(a => ((GameResolutionDto)a![0]!).IsAnswerCorrect == true),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task OnTimeout_WhenResolvePendingGameAsyncReturnsNullAnswer_StillBroadcastsGameResolved()
    {
        _gameService.ResolvePendingGameAsync().Returns(new GameResolution
        {
            IsAnswerCorrect = false,
            PointsAwarded = 0,
            CurrentScore = 0,
            TeamAnswer = null,
            ResolutionType = GameResolutionType.TNP
        });

        var sut = CreateSut();
        await sut.StartAsync(CancellationToken.None);

        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        _clientProxy.SendCoreAsync("GameResolved", Arg.Any<object?[]?>(), Arg.Any<CancellationToken>())
            .Returns(ci => { tcs.TrySetResult(true); return Task.CompletedTask; });

        _timerService.OnTimeout += Raise.Event<Action>();

        await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await _clientProxy.Received(1).SendCoreAsync("GameResolved",
            Arg.Is<object?[]?>(a => ((GameResolutionDto)a![0]!).TeamAnswer == null),
            Arg.Any<CancellationToken>());
    }
}
