using System.Text.Json;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;

namespace GameServer.Infrastructure.Repositories;

/// <summary>
/// Repository that loads confederates from JSON files.
/// </summary>
public class JsonConfederateRepository : IConfederateRepository
{
    private readonly string _femaleFilePath;
    private readonly string _maleFilePath;
    private List<Confederate>? _femaleCache;
    private List<Confederate>? _maleCache;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public JsonConfederateRepository(string femaleFilePath, string maleFilePath)
    {
        _femaleFilePath = femaleFilePath;
        _maleFilePath = maleFilePath;
    }

    public async Task<List<Confederate>> GetFemaleAsync()
    {
        if (_femaleCache is null)
            _femaleCache = await LoadFromFileAsync(_femaleFilePath);
        return _femaleCache;
    }

    public async Task<List<Confederate>> GetMaleAsync()
    {
        if (_maleCache is null)
            _maleCache = await LoadFromFileAsync(_maleFilePath);
        return _maleCache;
    }

    private static async Task<List<Confederate>> LoadFromFileAsync(string path)
    {
        if (!File.Exists(path))
            return new List<Confederate>();

        var json = await File.ReadAllTextAsync(path);
        return JsonSerializer.Deserialize<List<Confederate>>(json, JsonOptions) ?? new List<Confederate>();
    }
}
