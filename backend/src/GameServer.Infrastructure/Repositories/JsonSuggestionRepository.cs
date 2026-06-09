using System.Text.Json;
using GameServer.Application.Interfaces;

namespace GameServer.Infrastructure.Repositories;

public class JsonSuggestionRepository : ISuggestionRepository
{
    private readonly Lazy<Task<IReadOnlyList<IReadOnlyList<string>>>> _loader;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public JsonSuggestionRepository(string filePath)
    {
        _loader = new Lazy<Task<IReadOnlyList<IReadOnlyList<string>>>>(() => LoadAsync(filePath));
    }

    private static async Task<IReadOnlyList<IReadOnlyList<string>>> LoadAsync(string filePath)
    {
        if (!File.Exists(filePath))
            return Array.Empty<IReadOnlyList<string>>();

        var json = await File.ReadAllTextAsync(filePath);
        var data = JsonSerializer.Deserialize<List<List<string>>>(json, JsonOptions) ?? new();
        return data.Select(row => (IReadOnlyList<string>)row.AsReadOnly()).ToList().AsReadOnly();
    }

    public Task<IReadOnlyList<IReadOnlyList<string>>> GetAllAsync() => _loader.Value;
}
