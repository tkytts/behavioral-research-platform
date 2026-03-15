using FluentAssertions;
using GameServer.Application;
using GameServer.Infrastructure.Repositories;
using Microsoft.Extensions.Options;
using Xunit;

namespace GameServer.Infrastructure.Tests.Repositories;

public class FileNotesRepositoryTests : IDisposable
{
    private readonly string _testLogPath;
    private readonly FileNotesRepository _sut;

    public FileNotesRepositoryTests()
    {
        _testLogPath = Path.Combine(Path.GetTempPath(), $"test-notes-{Guid.NewGuid()}");
        var settings = Options.Create(new GameSettings { LogPath = _testLogPath });
        _sut = new FileNotesRepository(settings);
    }

    [Fact]
    public async Task SaveAsync_CreatesNotesSubdirectory()
    {
        await _sut.SaveAsync("test content");

        Directory.Exists(Path.Combine(_testLogPath, "notes")).Should().BeTrue();
    }

    [Fact]
    public async Task SaveAsync_CreatesFile()
    {
        await _sut.SaveAsync("test content");

        var files = Directory.GetFiles(Path.Combine(_testLogPath, "notes"), "notes_*.txt");
        files.Should().NotBeEmpty();
    }

    [Fact]
    public async Task SaveAsync_FileContainsContent()
    {
        const string notesText = "My research notes here";

        await _sut.SaveAsync(notesText);

        var files = Directory.GetFiles(Path.Combine(_testLogPath, "notes"), "notes_*.txt");
        var content = await File.ReadAllTextAsync(files[0]);
        content.Should().Contain(notesText);
    }

    [Fact]
    public async Task SaveAsync_CreatesDirectoryIfNotExists()
    {
        Directory.Exists(_testLogPath).Should().BeFalse();

        await _sut.SaveAsync("some notes");

        Directory.Exists(Path.Combine(_testLogPath, "notes")).Should().BeTrue();
    }

    public void Dispose()
    {
        if (Directory.Exists(_testLogPath))
        {
            Directory.Delete(_testLogPath, recursive: true);
        }
    }
}
