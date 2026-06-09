using System.Text.Json;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;

namespace GameServer.Infrastructure.Repositories;

/// <summary>
/// Repository that loads blocks from a JSON file.
/// </summary>
public class JsonBlockRepository : IBlockRepository
{
    private readonly Lazy<Task<IReadOnlyList<Block>>> _loader;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public JsonBlockRepository(string filePath)
    {
        _loader = new Lazy<Task<IReadOnlyList<Block>>>(() => LoadAsync(filePath));
    }

    private static async Task<IReadOnlyList<Block>> LoadAsync(string filePath)
    {
        if (!File.Exists(filePath))
            return Array.Empty<Block>();

        var json = await File.ReadAllTextAsync(filePath);
        return JsonSerializer.Deserialize<List<Block>>(json, JsonOptions) ?? new List<Block>();
    }

    public Task<IReadOnlyList<Block>> GetAllAsync() => _loader.Value;

    public async Task<Block?> GetByIndexAsync(int index)
    {
        var blocks = await GetAllAsync();
        return index >= 0 && index < blocks.Count ? blocks[index] : null;
    }
}
