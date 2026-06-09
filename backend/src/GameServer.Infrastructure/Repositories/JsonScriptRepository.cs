using System.Text.Json;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;

namespace GameServer.Infrastructure.Repositories;

/// <summary>
/// Repository that loads scripts from a JSON file.
/// </summary>
public class JsonScriptRepository : IScriptRepository
{
    private readonly string _filePath;
    private Dictionary<string, Script>? _cache;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public JsonScriptRepository(string filePath)
    {
        _filePath = filePath;
    }

    public async Task<Script?> GetByOrderAsync(int order)
    {
        if (_cache is null)
        {
            if (!File.Exists(_filePath))
                return null;

            var json = await File.ReadAllTextAsync(_filePath);
            _cache = JsonSerializer.Deserialize<Dictionary<string, Script>>(json, JsonOptions) ?? new();
        }

        return _cache.Values.FirstOrDefault(s => s.Orders.Contains(order));
    }
}
