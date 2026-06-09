using GameServer.Application.Interfaces;
using GameServer.Domain.Constants;
using GameServer.Domain.Entities;
using GameServer.Domain.Enums;
using Microsoft.Extensions.Options;

namespace GameServer.Application.Services;

/// <summary>
/// Manages core game logic including problem navigation and scoring.
/// </summary>
public class GameService : IGameService
{
    private readonly GameState _state;
    private readonly IBlockRepository _blockRepository;
    private readonly ITelemetryRepository _telemetryRepository;
    private int _pointsAwarded;

    public GameService(
        GameState state,
        IBlockRepository blockRepository,
        ITelemetryRepository telemetryRepository,
        IOptions<GameSettings> settings)
    {
        _state = state;
        _blockRepository = blockRepository;
        _telemetryRepository = telemetryRepository;
        _pointsAwarded = settings.Value.PointsAwarded;
    }

    public GameState State => _state;

    public int PointsAwarded
    {
        get => _pointsAwarded;
        set => _pointsAwarded = value;
    }

    public void StartGame()
    {
        _state.Start();
    }

    public void StopGame()
    {
        _state.Stop();
    }

    public void SetProblemSelection(int blockIndex, int problemIndex)
    {
        _state.SetProblemSelection(blockIndex, problemIndex);
    }

    public async Task<(Block? Block, string? Problem)> FirstBlock()
    {
        _state.FirstBlock();
        return await GetCurrentProblem();
    }

    public async Task<(Block? Block, string? Problem)> NextBlock()
    {
        _state.NextBlock();
        return await GetCurrentProblem();
    }

    public async Task<(Block? Block, string? Problem)> NextProblem()
    {
        var blocks = await _blockRepository.GetAllAsync();
        int maxProblems = 0;
        if (_state.CurrentBlockIndex.HasValue &&
            _state.CurrentBlockIndex.Value >= 0 &&
            _state.CurrentBlockIndex.Value < blocks.Count)
        {
            maxProblems = blocks[_state.CurrentBlockIndex.Value].Problems.Count;
        }
        _state.NextProblem(maxProblems);
        return await GetCurrentProblem();
    }

    public async Task<(Block? Block, string? Problem)> GetCurrentProblem()
    {
        var blocks = await _blockRepository.GetAllAsync();

        if (!_state.CurrentBlockIndex.HasValue ||
            _state.CurrentBlockIndex < 0 ||
            _state.CurrentBlockIndex >= blocks.Count)
        {
            return (null, null);
        }

        var block = blocks[_state.CurrentBlockIndex.Value];

        if (!_state.CurrentProblemIndex.HasValue ||
            _state.CurrentProblemIndex < 0 ||
            _state.CurrentProblemIndex >= block.Problems.Count)
        {
            return (block, null);
        }

        var problem = block.Problems[_state.CurrentProblemIndex.Value];
        return (block, problem);
    }

    public GameResolution ResolveGame(GameResolutionType resolutionType, string? teamAnswer)
    {
        var isCorrect = resolutionType is GameResolutionType.AP or GameResolutionType.DP;
        var pointsAwarded = isCorrect ? _pointsAwarded : 0;

        if (isCorrect)
        {
            _state.AwardPoints(pointsAwarded);
        }

        var finalAnswer = resolutionType == GameResolutionType.TNP ? null : teamAnswer;

        return new GameResolution
        {
            IsAnswerCorrect = isCorrect,
            PointsAwarded = pointsAwarded,
            CurrentScore = _state.CurrentScore,
            TeamAnswer = finalAnswer,
            ResolutionType = resolutionType
        };
    }

    public async Task<GameResolution> ResolvePendingGameAsync()
    {
        var resolutionType = _state.PendingResolutionType ?? GameResolutionType.TNP;
        var teamAnswer = _state.TeamAnswer;

        var resolution = ResolveGame(resolutionType, teamAnswer);

        await _telemetryRepository.SaveAsync(new TelemetryEvent
        {
            User = _state.ParticipantName ?? "Unknown",
            Confederate = _state.ConfederateName,
            Action = TelemetryAction.GameResolved,
            Resolution = resolutionType.ToString(),
            Answer = teamAnswer,
            Timestamp = DateTime.UtcNow
        });

        _state.PendingResolutionType = null;
        _state.TeamAnswer = null;

        return resolution;
    }

    public void ResetScore()
    {
        _state.ResetScore();
    }
}
