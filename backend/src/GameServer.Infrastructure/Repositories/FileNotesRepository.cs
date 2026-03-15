using GameServer.Application;
using GameServer.Application.Interfaces;
using Microsoft.Extensions.Options;

namespace GameServer.Infrastructure.Repositories;

/// <summary>
/// Repository that saves researcher notes to text files.
/// </summary>
public class FileNotesRepository : INotesRepository
{
    private readonly string _logPath;

    public FileNotesRepository(IOptions<GameSettings> settings)
    {
        _logPath = settings.Value.LogPath;
    }

    public async Task SaveAsync(string content)
    {
        var notesDir = Path.Combine(_logPath, "notes");
        Directory.CreateDirectory(notesDir);

        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm-ss");
        var filePath = Path.Combine(notesDir, $"notes_{timestamp}.txt");
        var fileContent = $"Researcher Notes — {timestamp}\n\n{content}";
        await File.WriteAllTextAsync(filePath, fileContent);
    }
}
