using FluentAssertions;
using GameServer.Application;
using GameServer.Domain.Entities;
using GameServer.Domain.Constants;
using GameServer.Infrastructure.Repositories;
using Microsoft.Extensions.Options;
using Xunit;

namespace GameServer.Infrastructure.Tests.Repositories;

public class CsvTelemetryRepositoryTests : IDisposable
{
    private readonly string _testLogPath;
    private readonly CsvTelemetryRepository _sut;

    public CsvTelemetryRepositoryTests()
    {
        _testLogPath = Path.Combine(Path.GetTempPath(), $"test-logs-{Guid.NewGuid()}");
        var settings = Options.Create(new GameSettings { LogPath = _testLogPath });
        _sut = new CsvTelemetryRepository(settings);
    }

    [Fact]
    public async Task SaveAsync_CreatesFile()
    {
        // Arrange
        var telemetryEvent = new TelemetryEvent
        {
            User = "TestUser",
            Confederate = "Confederate1",
            Action = TelemetryAction.Edit,
            Text = "some text",
            Timestamp = DateTime.UtcNow
        };

        // Act
        await _sut.SaveAsync(telemetryEvent);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "*.csv");
        files.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SaveAsync_AppendsToExistingFile()
    {
        // Arrange
        var event1 = new TelemetryEvent { User = "TestUser", Action = TelemetryAction.Edit };
        var event2 = new TelemetryEvent { User = "TestUser", Action = TelemetryAction.MessageSent };

        // Act
        await _sut.SaveAsync(event1);
        await _sut.SaveAsync(event2);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "*TestUser*.csv");
        files.Should().HaveCount(1);
        var content = await File.ReadAllTextAsync(files[0]);
        content.Should().Contain(TelemetryAction.Edit);
        content.Should().Contain(TelemetryAction.MessageSent);
    }

    [Fact]
    public async Task SaveAsync_WritesCorrectHeaders()
    {
        // Arrange
        var telemetryEvent = new TelemetryEvent
        {
            User = "TestUser",
            Action = TelemetryAction.Edit
        };

        // Act
        await _sut.SaveAsync(telemetryEvent);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "*.csv");
        var content = await File.ReadAllTextAsync(files[0]);
        content.Should().Contain("User");
        content.Should().Contain("Confederate");
        content.Should().Contain("Action");
        content.Should().Contain("Timestamp");
        content.Should().Contain("Resolution");
        content.Should().Contain("Answer");
    }

    [Fact]
    public async Task SaveAsync_WritesAnswerToRow()
    {
        // Arrange
        var telemetryEvent = new TelemetryEvent
        {
            User = "TestUser",
            Action = TelemetryAction.GameResolved,
            Resolution = "AP",
            Answer = "the team answer"
        };

        // Act
        await _sut.SaveAsync(telemetryEvent);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "*TestUser*.csv");
        var content = await File.ReadAllTextAsync(files[0]);
        content.Should().Contain("the team answer");
    }

    [Fact]
    public async Task SaveAsync_ConfederateMessage_UsesConfederateNameInFilename()
    {
        // Arrange
        var telemetryEvent = new TelemetryEvent
        {
            User = "Participant",
            Confederate = "Confederate1",
            Action = TelemetryAction.ConfederateMessage
        };

        // Act
        await _sut.SaveAsync(telemetryEvent);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "*Confederate1*.csv");
        files.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SaveAsync_SanitizesPathTraversal_InUsername()
    {
        // Arrange
        var telemetryEvent = new TelemetryEvent
        {
            User = "../../evil",
            Action = TelemetryAction.Edit,
            Timestamp = DateTime.UtcNow
        };

        // Act
        await _sut.SaveAsync(telemetryEvent);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "*.csv");
        files.Should().NotBeEmpty();
        files.Should().AllSatisfy(f => f.Should().StartWith(_testLogPath));
    }

    [Fact]
    public async Task SaveAsync_ConfederateMessage_NullConfederate_FallsBackToUser()
    {
        // Arrange
        var telemetryEvent = new TelemetryEvent
        {
            User = "Participant",
            Confederate = null,
            Action = TelemetryAction.ConfederateMessage,
            Timestamp = DateTime.UtcNow
        };

        // Act
        await _sut.SaveAsync(telemetryEvent);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "*Participant*.csv");
        files.Should().NotBeEmpty();
    }

    public void Dispose()
    {
        if (Directory.Exists(_testLogPath))
        {
            Directory.Delete(_testLogPath, recursive: true);
        }
    }
}
