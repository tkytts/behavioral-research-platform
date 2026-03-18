using FluentAssertions;
using GameServer.Domain.Entities;
using Xunit;

namespace GameServer.Application.Tests.Services;

public class GameStateTests
{
    [Fact]
    public void NewState_HasDefaultValues()
    {
        // Act
        var state = new GameState();

        // Assert
        state.Messages.Should().BeEmpty();
        state.CurrentScore.Should().Be(0);
        state.CurrentBlockIndex.Should().BeNull();
        state.CurrentProblemIndex.Should().BeNull();
        state.IsLive.Should().BeFalse();
    }

    [Fact]
    public void AddMessage_IsThreadSafe()
    {
        // Arrange
        var state = new GameState();
        var tasks = new List<Task>();

        // Act - Add messages from multiple threads
        for (int i = 0; i < 100; i++)
        {
            var index = i;
            tasks.Add(Task.Run(() =>
                state.AddMessage(new Message { User = $"User{index}", Text = $"Message{index}" })));
        }
        Task.WaitAll(tasks.ToArray());

        // Assert
        state.Messages.Should().HaveCount(100);
    }

    [Fact]
    public void ClearMessages_ReturnsAndClears()
    {
        // Arrange
        var state = new GameState();
        state.AddMessage(new Message { User = "User", Text = "Test" });

        // Act
        var messages = state.ClearMessages();

        // Assert
        messages.Should().HaveCount(1);
        state.Messages.Should().BeEmpty();
    }

    [Fact]
    public void AwardPoints_AccumulatesScore()
    {
        // Arrange
        var state = new GameState();

        // Act
        state.AwardPoints(100);
        state.AwardPoints(50);

        // Assert
        state.CurrentScore.Should().Be(150);
    }

    [Fact]
    public void Reset_ClearsEverything()
    {
        // Arrange
        var state = new GameState();
        state.AddMessage(new Message { User = "User", Text = "Test" });
        state.AwardPoints(100);
        state.Start();
        state.FirstBlock();

        // Act
        state.Reset();

        // Assert
        state.Messages.Should().BeEmpty();
        state.CurrentScore.Should().Be(0);
        state.CurrentBlockIndex.Should().BeNull();
        state.CurrentProblemIndex.Should().BeNull();
        state.IsLive.Should().BeFalse();
    }

    [Fact]
    public void Reset_ClearsParticipantNameConfederateNameAndChimesConfig()
    {
        // Arrange
        var state = new GameState();
        state.ParticipantName = "Alice";
        state.ConfederateName = "Bob";
        state.ChimesConfig = new ChimesConfig { MessageSent = true, MessageReceived = false, Timer = true };

        // Act
        state.Reset();

        // Assert
        state.ParticipantName.Should().BeNull();
        state.ConfederateName.Should().BeNull();
        state.ChimesConfig.Should().BeNull();
    }

    [Fact]
    public void NewState_InterruptCountIsZero()
    {
        var state = new GameState();
        state.GetAndResetInterruptCount().Should().Be(0);
    }

    [Fact]
    public void IncrementInterruptCount_IncrementsCounter()
    {
        var state = new GameState();
        state.IncrementInterruptCount();
        state.IncrementInterruptCount();
        state.GetAndResetInterruptCount().Should().Be(2);
    }

    [Fact]
    public void GetAndResetInterruptCount_ResetsToZero()
    {
        var state = new GameState();
        state.IncrementInterruptCount();
        state.GetAndResetInterruptCount(); // consume
        state.GetAndResetInterruptCount().Should().Be(0);
    }

    [Fact]
    public void Reset_ClearsInterruptCount()
    {
        var state = new GameState();
        state.IncrementInterruptCount();
        state.Reset();
        state.GetAndResetInterruptCount().Should().Be(0);
    }

    [Fact]
    public void IncrementInterruptCount_IsThreadSafe()
    {
        // Arrange
        var state = new GameState();
        var tasks = new List<Task>();

        // Act
        for (int i = 0; i < 100; i++)
        {
            tasks.Add(Task.Run(() => state.IncrementInterruptCount()));
        }
        Task.WaitAll(tasks.ToArray());

        // Assert
        state.GetAndResetInterruptCount().Should().Be(100);
    }

    [Fact]
    public void NextProblem_WrapsAround()
    {
        // Arrange
        var state = new GameState();
        state.FirstBlock();

        // Act - go through 5 problems (0-4) then wrap
        state.NextProblem(5);
        state.NextProblem(5);
        state.NextProblem(5);
        state.NextProblem(5);
        state.NextProblem(5); // Should wrap to 0

        // Assert
        state.CurrentProblemIndex.Should().Be(0);
    }
}
