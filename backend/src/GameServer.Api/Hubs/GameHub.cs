using GameServer.Application.DTOs;
using GameServer.Application.Interfaces;
using GameServer.Domain.Constants;
using GameServer.Domain.Entities;
using GameServer.Domain.Enums;
using GameServer.Infrastructure.Helpers;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Hubs;

/// <summary>
/// SignalR hub for real-time game communication.
/// Replaces all Socket.IO event handlers from the original server.js.
/// </summary>
public class GameHub : Hub
{
    private readonly IGameService _gameService;
    private readonly IChatService _chatService;
    private readonly ITimerService _timerService;
    private readonly ITelemetryRepository _telemetryRepository;
    private readonly IChatLogRepository _chatLogRepository;
    private readonly INotesRepository _notesRepository;
    private readonly ISessionContext _sessionContext;
    private readonly ILogger<GameHub> _logger;

    public GameHub(
        IGameService gameService,
        IChatService chatService,
        ITimerService timerService,
        ITelemetryRepository telemetryRepository,
        IChatLogRepository chatLogRepository,
        INotesRepository notesRepository,
        ISessionContext sessionContext,
        ILogger<GameHub> logger)
    {
        _gameService = gameService;
        _chatService = chatService;
        _timerService = timerService;
        _telemetryRepository = telemetryRepository;
        _chatLogRepository = chatLogRepository;
        _notesRepository = notesRepository;
        _sessionContext = sessionContext;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client connected: {ConnectionId}", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client disconnected: {ConnectionId}", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }

    #region Participant Management

    /// <summary>
    /// Sets the participant name for this session.
    /// </summary>
    public Task SetParticipantName(string name)
    {
        _logger.LogInformation("Participant connected: {Name}", name);
        _gameService.State.ParticipantName = name;
        _sessionContext.SessionFolder = $"{FilenameHelper.SanitizeForFilename(name)}_{DateTime.UtcNow:dd-MM-yy}";
        return Task.CompletedTask;
    }

    /// <summary>
    /// Sets the confederate name.
    /// </summary>
    public async Task SetConfederate(string name)
    {
        _gameService.State.ConfederateName = name;
        await Clients.All.SendAsync("NewConfederate", name);
    }

    /// <summary>
    /// Returns the current confederate name (used by participant on reconnect).
    /// </summary>
    public Task<string> GetConfederate()
    {
        return Task.FromResult(_gameService.State.ConfederateName ?? string.Empty);
    }

    #endregion

    #region Chat

    /// <summary>
    /// Sends a chat message to all connected clients.
    /// </summary>
    public async Task SendMessage(ChatMessageDto messageDto)
    {
        var message = new Message
        {
            User = messageDto.User,
            Text = messageDto.Text,
            Timestamp = DateTime.UtcNow
        };

        _chatService.AddMessage(message);
        await Clients.All.SendAsync("ReceiveMessage", messageDto);
    }

    /// <summary>
    /// Notifies other clients that a user is typing.
    /// </summary>
    public async Task Typing(string username)
    {
        await Clients.Others.SendAsync("UserTyping", username);
    }

    /// <summary>
    /// Clears the chat and saves messages to a log file.
    /// </summary>
    public async Task ClearChat()
    {
        await _chatService.ClearAndSaveAsync();
        await Clients.All.SendAsync("ChatCleared");
    }

    #endregion

    #region Problem Navigation

    /// <summary>
    /// Updates the current problem selection.
    /// </summary>
    public async Task UpdateProblemSelection(ProblemSelectionDto selection)
    {
        _gameService.SetProblemSelection(selection.BlockIndex, selection.ProblemIndex);
        var (block, problem) = await _gameService.GetCurrentProblem();
        await BroadcastProblemUpdate(block, problem);
    }

    /// <summary>
    /// Moves to the first block.
    /// </summary>
    public async Task FirstBlock()
    {
        var (block, problem) = await _gameService.FirstBlock();
        await BroadcastProblemUpdate(block, problem);
    }

    /// <summary>
    /// Moves to the next block.
    /// </summary>
    public async Task NextBlock()
    {
        var (block, problem) = await _gameService.NextBlock();
        await BroadcastProblemUpdate(block, problem);
    }

    /// <summary>
    /// Moves to the next problem.
    /// </summary>
    public async Task NextProblem()
    {
        await _telemetryRepository.SaveAsync(new TelemetryEvent
        {
            User = _gameService.State.ParticipantName ?? "Unknown",
            Confederate = _gameService.State.ConfederateName,
            Action = TelemetryAction.NextProblem,
            Timestamp = DateTime.UtcNow
        });

        var (block, problem) = await _gameService.NextProblem();
        await BroadcastProblemUpdate(block, problem);
    }

    /// <summary>
    /// Sends a tutorial problem update.
    /// </summary>
    public async Task TutorialProblem(ProblemUpdateDto data)
    {
        await Clients.All.SendAsync("ProblemUpdate", data);
    }

    private async Task BroadcastProblemUpdate(Block? block, string? problem)
    {
        var dto = new ProblemUpdateDto(
            block is null ? null : new BlockDto(block.BlockName),
            Problem: problem is null ? string.Empty : problem
        );
        await Clients.All.SendAsync("ProblemUpdate", dto);
    }

    #endregion

    #region Timer

    /// <summary>
    /// Starts the game timer.
    /// </summary>
    public Task StartTimer()
    {
        _timerService.Start();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Stops the game timer.
    /// </summary>
    public Task StopTimer()
    {
        _timerService.Stop();
        return Task.CompletedTask;
    }

    /// <summary>
    /// Resets the game timer.
    /// </summary>
    public async Task ResetTimer()
    {
        _timerService.Reset();
        await Clients.All.SendAsync("TimerUpdate", _timerService.CurrentCountdown);
    }

    /// <summary>
    /// Sets the maximum time for the timer.
    /// </summary>
    public async Task SetMaxTime(int time)
    {
        _timerService.MaxTime = time;
        await Clients.All.SendAsync("TimerUpdate", _timerService.CurrentCountdown);
        _logger.LogInformation("Max time set to: {Time}", time);
    }

    #endregion

    #region Game Control

    /// <summary>
    /// Starts the game.
    /// </summary>
    public async Task StartGame()
    {
        _gameService.StartGame();

        await _telemetryRepository.SaveAsync(new TelemetryEvent
        {
            User = _gameService.State.ParticipantName ?? "Unknown",
            Confederate = _gameService.State.ConfederateName,
            Action = TelemetryAction.NewGame,
            Timestamp = DateTime.UtcNow
        });

        await Clients.All.SendAsync("StatusUpdate", true);
        _logger.LogInformation("Game is live");
    }

    /// <summary>
    /// Stops the game.
    /// </summary>
    public async Task StopGame()
    {
        _gameService.StopGame();
        await Clients.All.SendAsync("StatusUpdate", false);
        _logger.LogInformation("Game is not live");
    }

    /// <summary>
    /// Sets the game resolution type and team answer.
    /// The resolution is stored but GameResolved is only broadcast when the timer reaches 0.
    /// </summary>
    public async Task SetGameResolution(SetGameResolutionDto data)
    {
        if (Enum.TryParse<GameResolutionType>(data.GameResolutionType, out var resolutionType))
        {
            var answer = data.TeamAnswer;

            await _telemetryRepository.SaveAsync(new TelemetryEvent
            {
                User = _gameService.State.ParticipantName ?? "Unknown",
                Confederate = _gameService.State.ConfederateName,
                Action = TelemetryAction.TeamAnswerSet,
                Answer = answer,
                Timestamp = DateTime.UtcNow
            });
            _gameService.State.PendingResolutionType = resolutionType;
            _gameService.State.TeamAnswer = answer;
            await Clients.All.SendAsync("SetAnswer", data.TeamAnswer ?? string.Empty);
        }
    }

    /// <summary>
    /// Resets the score to zero.
    /// </summary>
    public async Task ResetPoints()
    {
        _gameService.ResetScore();
        await Clients.All.SendAsync("PointsUpdate", 0);
    }

    /// <summary>
    /// Sets the points awarded per correct answer.
    /// </summary>
    public Task SetPointsAwarded(int points)
    {
        _gameService.PointsAwarded = points;
        _logger.LogInformation("Points awarded set to: {Points}", points);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Clears the current answer.
    /// </summary>
    public async Task ClearAnswer()
    {
        await Clients.All.SendAsync("SetAnswer", string.Empty);
    }

    /// <summary>
    /// Sets the team answer display.
    /// </summary>
    public async Task SetAnswer(string answer)
    {
        await Clients.All.SendAsync("SetAnswer", answer);
    }

    /// <summary>
    /// Signals that a block has finished.
    /// </summary>
    public async Task BlockFinished()
    {
        _timerService.Stop();
        _gameService.State.PendingResolutionType = null;
        _gameService.State.TeamAnswer = null;
        _gameService.State.ConfederateName = null;

        var interruptCount = _gameService.State.GetAndResetInterruptCount();
        await _telemetryRepository.SaveAsync(new TelemetryEvent
        {
            User = _gameService.State.ParticipantName ?? "Unknown",
            Confederate = _gameService.State.ConfederateName,
            Action = TelemetryAction.BlockInterrupts,
            Text = interruptCount.ToString(),
            Timestamp = DateTime.UtcNow
        });
        await Clients.All.SendAsync("NewConfederate", string.Empty);
    }

    /// <summary>
    /// Signals that the game has ended.
    /// </summary>
    public async Task GameEnded()
    {
        await Clients.All.SendAsync("ShowEndModal");
    }

    #endregion

    #region Chimes

    /// <summary>
    /// Sets the chimes configuration.
    /// </summary>
    public async Task SetChimes(ChimesConfigDto data)
    {
        _gameService.State.ChimesConfig = new ChimesConfig
        {
            MessageSent = data.MessageSent,
            MessageReceived = data.MessageReceived,
            Timer = data.Timer
        };
        await Clients.All.SendAsync("ChimesUpdated", data);
    }

    /// <summary>
    /// Gets and broadcasts the current chimes configuration.
    /// </summary>
    public async Task GetChimes()
    {
        var config = _gameService.State.ChimesConfig;
        if (config is not null)
        {
            var dto = new ChimesConfigDto(config.MessageSent, config.MessageReceived, config.Timer);
            await Clients.Caller.SendAsync("ChimesUpdated", dto);
            _logger.LogInformation(
                "Chimes config propagated - MessageSent: {Sent}, MessageReceived: {Received}, Timer: {Timer}",
                config.MessageSent, config.MessageReceived, config.Timer);
        }
    }

    #endregion

    #region Notes

    /// <summary>
    /// Saves researcher notes to a text file.
    /// </summary>
    public async Task SaveNotes(string content)
    {
        await _notesRepository.SaveAsync(content);
    }

    #endregion

    #region Telemetry

    /// <summary>
    /// Saves a telemetry event.
    /// </summary>
    public async Task TelemetryEvent(TelemetryEventDto data)
    {
        await _telemetryRepository.SaveAsync(new TelemetryEvent
        {
            User = data.User,
            Confederate = data.Confederate,
            Action = data.Action,
            Text = data.Text,
            X = data.X,
            Y = data.Y,
            Resolution = data.Resolution,
            Timestamp = data.Timestamp ?? DateTime.UtcNow
        });

        if (data.Action == TelemetryAction.Interrupt)
        {
            _gameService.State.IncrementInterruptCount();
        }
    }

    /// <summary>
    /// Records tutorial completion.
    /// </summary>
    public async Task TutorialDone(int numTries)
    {
        await _chatLogRepository.SaveTutorialLogAsync(numTries);
        _gameService.State.ConfederateName = null;
        await Clients.All.SendAsync("NewConfederate", string.Empty);
        await Clients.All.SendAsync("TutorialDone", numTries);
    }

    #endregion
}