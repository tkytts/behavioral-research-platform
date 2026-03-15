using FluentAssertions;
using GameServer.Infrastructure.Repositories;
using Xunit;

namespace GameServer.Infrastructure.Tests.Repositories;

public class JsonScriptRepositoryTests : IDisposable
{
    private readonly string _filePath;

    private const string ScriptsJson = """
        {
          "script_0": {
            "orders": [1, 10],
            "message_groups": {
              "start_conversation": { "messages": ["olá"] }
            },
            "resolutions": [
              { "problem": 0, "resolution": "DNP" }
            ]
          },
          "script_1": {
            "orders": [2, 9],
            "message_groups": {},
            "resolutions": []
          }
        }
        """;

    public JsonScriptRepositoryTests()
    {
        _filePath = Path.GetTempFileName();
    }

    public void Dispose()
    {
        File.Delete(_filePath);
    }

    [Fact]
    public async Task GetByOrderAsync_ReturnsScript_WhenOrderMatches()
    {
        await File.WriteAllTextAsync(_filePath, ScriptsJson);
        var repo = new JsonScriptRepository(_filePath);

        var result = await repo.GetByOrderAsync(1);

        result.Should().NotBeNull();
        result!.Orders.Should().Contain(1);
        result.Resolutions.Should().HaveCount(1);
        result.Resolutions[0].Resolution.Should().Be("DNP");
    }

    [Fact]
    public async Task GetByOrderAsync_FindsScript_BySecondaryOrder()
    {
        await File.WriteAllTextAsync(_filePath, ScriptsJson);
        var repo = new JsonScriptRepository(_filePath);

        var result = await repo.GetByOrderAsync(10);

        result.Should().NotBeNull();
        result!.Orders.Should().Contain(10);
    }

    [Fact]
    public async Task GetByOrderAsync_ReturnsNull_WhenOrderNotFound()
    {
        await File.WriteAllTextAsync(_filePath, ScriptsJson);
        var repo = new JsonScriptRepository(_filePath);

        var result = await repo.GetByOrderAsync(999);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByOrderAsync_ReturnsNull_WhenFileDoesNotExist()
    {
        var repo = new JsonScriptRepository("nonexistent_scripts.json");

        var result = await repo.GetByOrderAsync(1);

        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByOrderAsync_ReturnsCachedResult()
    {
        await File.WriteAllTextAsync(_filePath, ScriptsJson);
        var repo = new JsonScriptRepository(_filePath);

        var first = await repo.GetByOrderAsync(1);
        // Overwrite file to verify cached result is returned
        await File.WriteAllTextAsync(_filePath, "{}");
        var second = await repo.GetByOrderAsync(1);

        second.Should().BeSameAs(first);
    }
}
