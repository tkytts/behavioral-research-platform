using FluentAssertions;
using GameServer.Application.Interfaces;
using GameServer.Application.Services;
using GameServer.Domain.Constants;
using GameServer.Domain.Entities;
using GameServer.Domain.Enums;
using Microsoft.Extensions.Options;
using NSubstitute;
using Xunit;

namespace GameServer.Application.Tests.Services;

public class GameServiceTests
{
    private readonly GameState _state;
    private readonly IBlockRepository _blockRepository;
    private readonly ITelemetryRepository _telemetryRepository;
    private readonly IOptions<GameSettings> _settings;
    private readonly GameService _sut;

    public GameServiceTests()
    {
        _state = new GameState();
        _blockRepository = Substitute.For<IBlockRepository>();
        _telemetryRepository = Substitute.For<ITelemetryRepository>();
        _settings = Options.Create(new GameSettings { PointsAwarded = 100 });

        // Setup default blocks
        var blocks = new List<Block>
        {
            new Block
            {
                BlockName = "Block 1",
                Problems = new List<string> { "p1", "p2", "p3" }
            },
            new Block
            {
                BlockName = "Block 2",
                Problems = new List<string> { "p4" }
            }
        };
        _blockRepository.GetAllAsync().Returns(blocks);

        _sut = new GameService(_state, _blockRepository, _telemetryRepository, _settings);
    }

    #region Game State Tests

    [Fact]
    public void StartGame_SetsIsLiveToTrue()
    {
        // Act
        _sut.StartGame();

        // Assert
        _state.IsLive.Should().BeTrue();
    }

    [Fact]
    public void StopGame_SetsIsLiveToFalse()
    {
        // Arrange
        _sut.StartGame();

        // Act
        _sut.StopGame();

        // Assert
        _state.IsLive.Should().BeFalse();
    }

    #endregion

    #region Problem Navigation Tests

    [Fact]
    public async Task FirstBlock_SetsIndicesCorrectly()
    {
        // Act
        var (block, problem) = await _sut.FirstBlock();

        // Assert
        _state.CurrentBlockIndex.Should().Be(0);
        _state.CurrentProblemIndex.Should().Be(0);
        block.Should().NotBeNull();
        block!.BlockName.Should().Be("Block 1");
        problem.Should().NotBeNull();
        problem!.Should().Be("p1");
    }

    [Fact]
    public async Task NextBlock_IncrementsBlockIndex()
    {
        // Arrange
        await _sut.FirstBlock();

        // Act
        var (block, _) = await _sut.NextBlock();

        // Assert
        _state.CurrentBlockIndex.Should().Be(1);
        _state.CurrentProblemIndex.Should().Be(0);
        block!.BlockName.Should().Be("Block 2");
    }

    [Fact]
    public async Task NextProblem_IncrementsProblemIndex()
    {
        // Arrange
        await _sut.FirstBlock();

        // Act
        var (_, problem) = await _sut.NextProblem();

        // Assert
        _state.CurrentProblemIndex.Should().Be(1);
        problem!.Should().Be("p2");
    }

    [Fact]
    public async Task NextProblem_UsesBlockProblemCount_NotHardcodedFive()
    {
        // Arrange: Block 1 has 3 problems. After going to last problem (index 2),
        // NextProblem should wrap to 0, not wrap at 4 (the old hardcoded default).
        await _sut.FirstBlock();
        await _sut.NextProblem(); // index 1
        await _sut.NextProblem(); // index 2

        // Act: one more NextProblem — should wrap back to 0 (block has 3 problems)
        var (_, problem) = await _sut.NextProblem();

        // Assert
        _state.CurrentProblemIndex.Should().Be(0);
        problem!.Should().Be("p1");
    }

    [Fact]
    public async Task SetProblemSelection_SetsIndicesCorrectly()
    {
        // Act
        _sut.SetProblemSelection(1, 0);
        var (block, problem) = await _sut.GetCurrentProblem();

        // Assert
        _state.CurrentBlockIndex.Should().Be(1);
        _state.CurrentProblemIndex.Should().Be(0);
        block!.BlockName.Should().Be("Block 2");
        problem!.Should().Be("p4");
    }

    [Fact]
    public async Task NextBlock_WhenAlreadyPastLastBlock_ReturnsNullTuple()
    {
        // Arrange: navigate to last block (index 1)
        await _sut.FirstBlock();
        await _sut.NextBlock();

        // Act: go beyond last block
        var (block, problem) = await _sut.NextBlock();

        // Assert
        block.Should().BeNull();
        problem.Should().BeNull();
        _state.CurrentBlockIndex.Should().Be(2); // Known design choice: index is not capped at the last block. If capping is added, update this assertion.
    }

    [Fact]
    public async Task GetCurrentProblem_WhenBlockIndexOutOfBounds_ReturnsNullTuple()
    {
        // Arrange
        _sut.SetProblemSelection(99, 0);

        // Act
        var (block, problem) = await _sut.GetCurrentProblem();

        // Assert
        block.Should().BeNull();
        problem.Should().BeNull();
    }

    [Fact]
    public async Task GetCurrentProblem_WhenProblemIndexOutOfBounds_ReturnsBlockButNullProblem()
    {
        // Arrange
        _sut.SetProblemSelection(0, 99);

        // Act
        var (block, problem) = await _sut.GetCurrentProblem();

        // Assert
        block.Should().NotBeNull();
        block!.BlockName.Should().Be("Block 1");
        problem.Should().BeNull();
    }

    [Fact]
    public void SetProblemSelection_WithOutOfBoundsBlockIndex_DoesNotThrow()
    {
        // Act & Assert
        var act = () => _sut.SetProblemSelection(99, 0);
        act.Should().NotThrow();
    }

    #endregion

    #region Game Resolution Tests

    [Theory]
    [InlineData(GameResolutionType.AP, true, 100)]
    [InlineData(GameResolutionType.DP, true, 100)]
    [InlineData(GameResolutionType.ANP, false, 0)]
    [InlineData(GameResolutionType.DNP, false, 0)]
    [InlineData(GameResolutionType.TNP, false, 0)]
    public void ResolveGame_ReturnsCorrectResult(
        GameResolutionType resolutionType,
        bool expectedCorrect,
        int expectedPoints)
    {
        // Act
        var result = _sut.ResolveGame(resolutionType, "test-answer");

        // Assert
        result.IsAnswerCorrect.Should().Be(expectedCorrect);
        result.PointsAwarded.Should().Be(expectedPoints);
    }

    [Fact]
    public void ResolveGame_WithCorrectAnswer_AccumulatesScore()
    {
        // Act
        _sut.ResolveGame(GameResolutionType.AP, "answer1");
        _sut.ResolveGame(GameResolutionType.DP, "answer2");
        var result = _sut.ResolveGame(GameResolutionType.AP, "answer3");

        // Assert
        result.CurrentScore.Should().Be(300);
        _state.CurrentScore.Should().Be(300);
    }

    [Fact]
    public void ResolveGame_OnTimeout_ClearsTeamAnswer()
    {
        // Act
        var result = _sut.ResolveGame(GameResolutionType.TNP, "some-answer");

        // Assert
        result.TeamAnswer.Should().BeNull();
    }

    [Fact]
    public void ResolveGame_NotTimeout_PreservesTeamAnswer()
    {
        // Act
        var result = _sut.ResolveGame(GameResolutionType.AP, "my-answer");

        // Assert
        result.TeamAnswer.Should().Be("my-answer");
    }

    [Fact]
    public void ResolveGame_SetsResolutionType()
    {
        // Act
        var result = _sut.ResolveGame(GameResolutionType.AP, "answer");

        // Assert
        result.ResolutionType.Should().Be(GameResolutionType.AP);
    }

    [Fact]
    public void ResetScore_SetsScoreToZero()
    {
        // Arrange
        _sut.ResolveGame(GameResolutionType.AP, "answer");
        _state.CurrentScore.Should().Be(100);

        // Act
        _sut.ResetScore();

        // Assert
        _state.CurrentScore.Should().Be(0);
    }

    #endregion

    #region ResolvePendingGameAsync Tests

    [Fact]
    public async Task ResolvePendingGameAsync_UsesPendingResolutionType()
    {
        // Arrange
        _state.ParticipantName = "Alice";
        _state.SetPendingResolution(GameResolutionType.AP, "42");

        // Act
        var result = await _sut.ResolvePendingGameAsync();

        // Assert
        result.IsAnswerCorrect.Should().BeTrue();
        result.ResolutionType.Should().Be(GameResolutionType.AP);
    }

    [Fact]
    public async Task ResolvePendingGameAsync_DefaultsToTNP_WhenNoPendingResolution()
    {
        // Arrange: no pending resolution set

        // Act
        var result = await _sut.ResolvePendingGameAsync();

        // Assert
        result.IsAnswerCorrect.Should().BeFalse();
        result.ResolutionType.Should().Be(GameResolutionType.TNP);
    }

    [Fact]
    public async Task ResolvePendingGameAsync_SavesTelemetryEvent()
    {
        // Arrange
        _state.ParticipantName = "Alice";
        _state.ConfederateName = "Bob";
        _state.SetPendingResolution(GameResolutionType.AP, "42");
        TelemetryEvent? captured = null;
        _telemetryRepository.SaveAsync(Arg.Do<TelemetryEvent>(e => captured = e))
            .Returns(Task.CompletedTask);

        // Act
        await _sut.ResolvePendingGameAsync();

        // Assert
        captured.Should().NotBeNull();
        captured!.Action.Should().Be(TelemetryAction.GameResolved);
        captured.Resolution.Should().Be("AP");
        captured.Answer.Should().Be("42");
        captured.User.Should().Be("Alice");
    }

    [Fact]
    public async Task ResolvePendingGameAsync_ClearsPendingResolutionAndTeamAnswer()
    {
        // Arrange
        _state.SetPendingResolution(GameResolutionType.AP, "42");

        // Act
        await _sut.ResolvePendingGameAsync();

        // Assert
        _state.PendingResolutionType.Should().BeNull();
        _state.TeamAnswer.Should().BeNull();
    }

    #endregion
}
