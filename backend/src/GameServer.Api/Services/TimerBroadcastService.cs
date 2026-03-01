using GameServer.Api.Hubs;
using GameServer.Application.DTOs;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using GameServer.Domain.Enums;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Services
{
    public class TimerBroadcastService : IHostedService
    {
        private readonly ITimerService _timerService;
        private readonly IGameService _gameService;
        private readonly ITelemetryRepository _telemetryRepository;
        private readonly IHubContext<GameHub> _hubContext;

        public TimerBroadcastService(
            ITimerService timerService,
            IGameService gameService,
            ITelemetryRepository telemetryRepository,
            IHubContext<GameHub> hubContext)
        {
            _timerService = timerService;
            _gameService = gameService;
            _telemetryRepository = telemetryRepository;
            _hubContext = hubContext;

            _timerService.OnTick += async (countdown) =>
            {
                await _hubContext.Clients.All.SendAsync("TimerUpdate", countdown);
            };

            _timerService.OnTimeout += async () =>
            {
                var resolutionType = _gameService.State.PendingResolutionType ?? GameResolutionType.TNP;
                var teamAnswer = _gameService.State.TeamAnswer;

                var resolution = _gameService.ResolveGame(resolutionType, teamAnswer);

                await _telemetryRepository.SaveAsync(new TelemetryEvent
                {
                    User = _gameService.State.ParticipantName ?? "Unknown",
                    Confederate = _gameService.State.ConfederateName,
                    Action = TelemetryAction.GameResolved,
                    Resolution = resolutionType.ToString(),
                    Answer = teamAnswer,
                    Timestamp = DateTime.UtcNow
                });

                var dto = new GameResolutionDto(
                    resolution.IsAnswerCorrect,
                    resolution.PointsAwarded,
                    resolution.CurrentScore,
                    resolution.TeamAnswer);

                await _hubContext.Clients.All.SendAsync("GameResolved", dto);

                _gameService.State.PendingResolutionType = null;
                _gameService.State.TeamAnswer = null;
            };
        }

        public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;
        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}