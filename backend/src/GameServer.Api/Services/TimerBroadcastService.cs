using GameServer.Api.Hubs;
using GameServer.Application.DTOs;
using GameServer.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Services;

public class TimerBroadcastService : IHostedService
{
    private readonly ITimerService _timerService;
    private readonly IGameService _gameService;
    private readonly IHubContext<GameHub> _hubContext;
    private readonly ILogger<TimerBroadcastService> _logger;

    public TimerBroadcastService(
        ITimerService timerService,
        IGameService gameService,
        IHubContext<GameHub> hubContext,
        ILogger<TimerBroadcastService> logger)
    {
        _timerService = timerService;
        _gameService = gameService;
        _hubContext = hubContext;
        _logger = logger;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _timerService.OnTick += OnTick;
        _timerService.OnTimeout += OnTimeout;
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timerService.OnTick -= OnTick;
        _timerService.OnTimeout -= OnTimeout;
        return Task.CompletedTask;
    }

    private void OnTick(int countdown)
    {
        _ = Task.Run(async () =>
        {
            try
            {
                await _hubContext.Clients.All.SendAsync("TimerUpdate", countdown);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting timer tick");
            }
        });
    }

    private void OnTimeout()
    {
        _ = Task.Run(async () =>
        {
            try
            {
                var resolution = await _gameService.ResolvePendingGameAsync();
                var dto = new GameResolutionDto(
                    resolution.IsAnswerCorrect,
                    resolution.PointsAwarded,
                    resolution.CurrentScore,
                    resolution.TeamAnswer);
                await _hubContext.Clients.All.SendAsync("GameResolved", dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error broadcasting game resolution on timeout");
            }
        });
    }
}
