using FluentAssertions;
using GameServer.Infrastructure.Repositories;
using System.Text.Json;
using Xunit;

namespace GameServer.Infrastructure.Tests.Repositories;

public class JsonBlockRepositoryTests : IDisposable
{
    private readonly string _path;

    public JsonBlockRepositoryTests()
    {
        _path = Path.GetTempFileName();
    }

    public void Dispose()
    {
        if (File.Exists(_path))
            File.Delete(_path);
    }

    [Fact]
    public async Task GetAllAsync_ReturnsEmpty_WhenFileDoesNotExist()
    {
        var repo = new JsonBlockRepository("nonexistent.json");

        var result = await repo.GetAllAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsEmpty_OnRepeatedCallsWhenFileDoesNotExist()
    {
        // GetAllAsync returns early (before writing _cache) when the file does not exist,
        // so every call re-checks File.Exists. This is intentional: a file added after
        // startup will be picked up on the next call. Do not "fix" this by caching the
        // not-found result, as that would break callers that create the file post-startup.
        var repo = new JsonBlockRepository("nonexistent.json");

        var first = await repo.GetAllAsync();
        var second = await repo.GetAllAsync();

        first.Should().BeEmpty();
        second.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsEmpty_WhenJsonIsEmptyArray()
    {
        await File.WriteAllTextAsync(_path, "[]");
        var repo = new JsonBlockRepository(_path);

        var result = await repo.GetAllAsync();

        result.Should().BeEmpty();
    }

    // NOTE: JsonBlockRepository propagates JsonException directly — callers are responsible for handling it.
    [Fact]
    public async Task GetAllAsync_PropagatesJsonException_WhenJsonIsMalformed()
    {
        await File.WriteAllTextAsync(_path, "{ not valid json [[[");
        var repo = new JsonBlockRepository(_path);

        var act = async () => await repo.GetAllAsync();

        await act.Should().ThrowAsync<JsonException>();
    }

    [Fact]
    public async Task GetAllAsync_ReturnsCachedResult_OnSecondCall()
    {
        await File.WriteAllTextAsync(_path, """[{"blockName":"Block 1","problems":["p1"]}]""");
        var repo = new JsonBlockRepository(_path);

        var first = await repo.GetAllAsync();
        // Overwrite file to verify the cached result is returned
        await File.WriteAllTextAsync(_path, "[]");
        var second = await repo.GetAllAsync();

        second.Should().BeSameAs(first);
        second.Should().HaveCount(1); // file was overwritten with [] — proves cache was used, not re-read
    }

    [Fact]
    public async Task GetByIndexAsync_ReturnsNull_WhenIndexIsNegative()
    {
        await File.WriteAllTextAsync(_path, """[{"blockName":"Block 1","problems":["p1"]}]""");
        var repo = new JsonBlockRepository(_path);

        var result = await repo.GetByIndexAsync(-1);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIndexAsync_ReturnsNull_WhenIndexExceedsBounds()
    {
        await File.WriteAllTextAsync(_path, """[{"blockName":"Block 1","problems":["p1"]}]""");
        var repo = new JsonBlockRepository(_path);

        var result = await repo.GetByIndexAsync(99);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIndexAsync_ReturnsNull_WhenFileDoesNotExist()
    {
        var repo = new JsonBlockRepository("nonexistent.json");

        var result = await repo.GetByIndexAsync(0);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIndexAsync_WithValidIndex_ReturnsCorrectBlock()
    {
        await File.WriteAllTextAsync(_path, """
            [
                {"blockName":"Block 1","problems":["p1"]},
                {"blockName":"Block 2","problems":["p2","p3"]}
            ]
            """);
        var repo = new JsonBlockRepository(_path);

        var result = await repo.GetByIndexAsync(1);

        result.Should().NotBeNull();
        result!.BlockName.Should().Be("Block 2");
        result.Problems.Should().BeEquivalentTo(new[] { "p2", "p3" });
    }
}
