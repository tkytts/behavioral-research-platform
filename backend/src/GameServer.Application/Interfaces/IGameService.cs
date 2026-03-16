using GameServer.Domain.Entities;
using GameServer.Domain.Enums;

namespace GameServer.Application.Interfaces;

/// <summary>
/// Service for managing game logic.
/// </summary>
public interface IGameService
{
    /// <summary>
    /// Gets the current game state.
    /// </summary>
    GameState State { get; }

    /// <summary>
    /// Gets or sets the points awarded for a correct answer.
    /// </summary>
    int PointsAwarded { get; set; }

    /// <summary>
    /// Starts the game.
    /// </summary>
    void StartGame();

    /// <summary>
    /// Stops the game.
    /// </summary>
    void StopGame();

    /// <summary>
    /// Sets the problem selection.
    /// </summary>
    void SetProblemSelection(int blockIndex, int problemIndex);

    /// <summary>
    /// Moves to the first block.
    /// </summary>
    Task<(Block? Block, string? Problem)> FirstBlock();

    /// <summary>
    /// Moves to the next block.
    /// </summary>
    Task<(Block? Block, string? Problem)> NextBlock();

    /// <summary>
    /// Moves to the next problem.
    /// </summary>
    Task<(Block? Block, string? Problem)> NextProblem();

    /// <summary>
    /// Gets the current block and problem.
    /// </summary>
    Task<(Block? Block, string? Problem)> GetCurrentProblem();

    /// <summary>
    /// Resolves the current game round.
    /// </summary>
    GameResolution ResolveGame(GameResolutionType resolutionType, string? teamAnswer);

    /// <summary>
    /// Resets the score to zero.
    /// </summary>
    void ResetScore();
}
