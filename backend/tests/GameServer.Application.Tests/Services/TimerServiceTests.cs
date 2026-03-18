using FluentAssertions;
using GameServer.Application.Services;
using Microsoft.Extensions.Options;
using Xunit;

namespace GameServer.Application.Tests.Services;

public class TimerServiceTests
{
    private readonly IOptions<GameSettings> _settings;

    public TimerServiceTests()
    {
        _settings = Options.Create(new GameSettings { MaxTime = 10 });
    }

    [Fact]
    public void Constructor_SetsInitialValues()
    {
        // Act
        var sut = new TimerService(_settings);

        // Assert
        sut.MaxTime.Should().Be(10);
        sut.CurrentCountdown.Should().Be(10);
        sut.IsRunning.Should().BeFalse();
    }

    [Fact]
    public void Start_SetsIsRunningTrue()
    {
        // Arrange
        var sut = new TimerService(_settings);

        // Act
        sut.Start();

        // Assert
        sut.IsRunning.Should().BeTrue();

        // Cleanup
        sut.Stop();
    }

    [Fact]
    public void Stop_SetsIsRunningFalse()
    {
        // Arrange
        var sut = new TimerService(_settings);
        sut.Start();

        // Act
        sut.Stop();

        // Assert
        sut.IsRunning.Should().BeFalse();
    }

    [Fact]
    public void Reset_SetsCountdownToMaxTime()
    {
        // Arrange
        var sut = new TimerService(_settings);

        // Act
        sut.Reset();

        // Assert
        sut.CurrentCountdown.Should().Be(10);
    }

    [Fact]
    public void SetMaxTime_UpdatesMaxTimeAndStopsTimer()
    {
        // Arrange
        var sut = new TimerService(_settings);
        sut.Start();

        // Act
        sut.MaxTime = 60;

        // Assert
        sut.MaxTime.Should().Be(60);
        sut.IsRunning.Should().BeFalse();
    }

    [Fact]
    public async Task Start_FiresOnTickEvent()
    {
        // Arrange
        var shortSettings = Options.Create(new GameSettings { MaxTime = 2 });
        var sut = new TimerService(shortSettings);
        var tcs = new TaskCompletionSource<int>(TaskCreationOptions.RunContinuationsAsynchronously);
        sut.OnTick += value => tcs.TrySetResult(value);

        // Act
        sut.Start();

        // Assert
        var tick = await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        tick.Should().BeInRange(0, 2);

        // Cleanup
        sut.Stop();
    }

    [Fact]
    public async Task Timer_FiresOnTimeoutWhenReachesZero()
    {
        // Arrange
        var shortSettings = Options.Create(new GameSettings { MaxTime = 1 });
        var sut = new TimerService(shortSettings);
        var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
        sut.OnTimeout += () => tcs.TrySetResult(true);

        // Act
        sut.Start();

        // Assert
        await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        sut.IsRunning.Should().BeFalse();
    }

    [Fact]
    public void Dispose_StopsTimer()
    {
        // Arrange
        var sut = new TimerService(_settings);
        sut.Start();

        // Act
        sut.Dispose();

        // Assert - should not throw
    }
}
