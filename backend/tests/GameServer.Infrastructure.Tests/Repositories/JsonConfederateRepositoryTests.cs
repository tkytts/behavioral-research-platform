using FluentAssertions;
using GameServer.Infrastructure.Repositories;
using Xunit;

namespace GameServer.Infrastructure.Tests.Repositories;

public class JsonConfederateRepositoryTests : IDisposable
{
    private readonly string _femalePath;
    private readonly string _malePath;

    public JsonConfederateRepositoryTests()
    {
        _femalePath = Path.GetTempFileName();
        _malePath = Path.GetTempFileName();
    }

    public void Dispose()
    {
        File.Delete(_femalePath);
        File.Delete(_malePath);
    }

    [Fact]
    public async Task GetFemaleAsync_ReturnsCorrectList()
    {
        await File.WriteAllTextAsync(_femalePath, """[{"order":1,"name":"Camila","gender":"F"}]""");
        await File.WriteAllTextAsync(_malePath, "[]");

        var repo = new JsonConfederateRepository(_femalePath, _malePath);
        var result = await repo.GetFemaleAsync();

        result.Should().HaveCount(1);
        result[0].Order.Should().Be(1);
        result[0].Name.Should().Be("Camila");
        result[0].Gender.Should().Be("F");
    }

    [Fact]
    public async Task GetMaleAsync_ReturnsCorrectList()
    {
        await File.WriteAllTextAsync(_femalePath, "[]");
        await File.WriteAllTextAsync(_malePath, """[{"order":1,"name":"Vitor","gender":"M"}]""");

        var repo = new JsonConfederateRepository(_femalePath, _malePath);
        var result = await repo.GetMaleAsync();

        result.Should().HaveCount(1);
        result[0].Order.Should().Be(1);
        result[0].Name.Should().Be("Vitor");
        result[0].Gender.Should().Be("M");
    }

    [Fact]
    public async Task GetFemaleAsync_ReturnsCachedResult()
    {
        await File.WriteAllTextAsync(_femalePath, """[{"order":1,"name":"Camila","gender":"F"}]""");
        await File.WriteAllTextAsync(_malePath, "[]");

        var repo = new JsonConfederateRepository(_femalePath, _malePath);

        var first = await repo.GetFemaleAsync();
        // Overwrite file to verify cached result is returned
        await File.WriteAllTextAsync(_femalePath, "[]");
        var second = await repo.GetFemaleAsync();

        second.Should().BeSameAs(first);
    }

    [Fact]
    public async Task GetFemaleAsync_ReturnsEmptyList_WhenFileDoesNotExist()
    {
        var repo = new JsonConfederateRepository("nonexistent_f.json", "nonexistent_m.json");

        var result = await repo.GetFemaleAsync();

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMaleAsync_ReturnsEmptyList_WhenFileDoesNotExist()
    {
        var repo = new JsonConfederateRepository("nonexistent_f.json", "nonexistent_m.json");

        var result = await repo.GetMaleAsync();

        result.Should().BeEmpty();
    }
}
