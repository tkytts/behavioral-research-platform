using FluentAssertions;
using GameServer.Application;
using GameServer.Domain.Entities;
using GameServer.Infrastructure;
using GameServer.Infrastructure.Repositories;
using Microsoft.Extensions.Options;
using Xunit;

namespace GameServer.Infrastructure.Tests.Repositories;

public class FileChatLogRepositoryTests : IDisposable
{
    private readonly string _testLogPath;
    private readonly FileChatLogRepository _sut;

    public FileChatLogRepositoryTests()
    {
        _testLogPath = Path.Combine(Path.GetTempPath(), $"test-chatlogs-{Guid.NewGuid()}");
        var settings = Options.Create(new GameSettings { LogPath = _testLogPath });
        _sut = new FileChatLogRepository(settings, new SessionContext(), string.Empty);
    }

    [Fact]
    public async Task SaveAsync_CreatesFile()
    {
        // Arrange
        var messages = new List<Message>
        {
            new() { User = "Alice", Text = "Hello", Timestamp = DateTime.UtcNow }
        };

        // Act
        await _sut.SaveAsync(messages);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "chat_logs_*.txt");
        files.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SaveAsync_EmptyMessages_DoesNotCreateFile()
    {
        // Arrange
        var messages = new List<Message>();

        // Act
        await _sut.SaveAsync(messages);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "chat_logs_*.txt");
        files.Should().BeEmpty();
    }

    [Fact]
    public async Task SaveAsync_FileContainsMessageContent()
    {
        // Arrange
        var messages = new List<Message>
        {
            new() { User = "Alice", Text = "Hello world", Timestamp = DateTime.UtcNow }
        };

        // Act
        await _sut.SaveAsync(messages);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "chat_logs_*.txt");
        var content = await File.ReadAllTextAsync(files[0]);
        content.Should().Contain("Alice");
        content.Should().Contain("Hello world");
    }

    [Fact]
    public async Task SaveTutorialLogAsync_CreatesFile()
    {
        // Act
        await _sut.SaveTutorialLogAsync(5);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "tutorial_logs_*.txt");
        files.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SaveTutorialLogAsync_FileContainsTriesCount()
    {
        // Act
        await _sut.SaveTutorialLogAsync(42);

        // Assert
        var files = Directory.GetFiles(_testLogPath, "tutorial_logs_*.txt");
        var content = await File.ReadAllTextAsync(files[0]);
        content.Should().Contain("42");
    }

    [Fact]
    public async Task SaveAsync_WithSessionFolder_WritesIntoSubdirectory()
    {
        // Arrange
        var sessionFolder = "Alice_15-03-26";
        var settings = Options.Create(new GameSettings { LogPath = _testLogPath });
        var sessionContext = new SessionContext { SessionFolder = sessionFolder };
        var sut = new FileChatLogRepository(settings, sessionContext, string.Empty);

        var messages = new List<Message>
        {
            new() { User = "Alice", Text = "Hello", Timestamp = DateTime.UtcNow }
        };

        // Act
        await sut.SaveAsync(messages);

        // Assert
        var subdir = Path.Combine(_testLogPath, sessionFolder);
        var files = Directory.GetFiles(subdir, "chat_logs_*.txt");
        files.Should().NotBeEmpty();
        files.Should().AllSatisfy(f => f.Should().StartWith(subdir));
    }

    [Fact]
    public async Task SaveTutorialLogAsync_WithNoSessionFolder_WritesIntoRootLogPath()
    {
        // Act — SessionContext.SessionFolder is null (default), simulating a tutorial run
        // where SetParticipantName was never called
        await _sut.SaveTutorialLogAsync(3);

        // Assert — tutorial log falls back to root log path by design
        var files = Directory.GetFiles(_testLogPath, "tutorial_logs_*.txt");
        files.Should().NotBeEmpty();
        files.Should().AllSatisfy(f => f.Should().StartWith(_testLogPath));
        Directory.GetDirectories(_testLogPath).Should().BeEmpty();
    }

    public void Dispose()
    {
        if (Directory.Exists(_testLogPath))
        {
            Directory.Delete(_testLogPath, recursive: true);
        }
    }
}
