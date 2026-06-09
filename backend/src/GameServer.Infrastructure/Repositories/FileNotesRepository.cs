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
    private readonly ISessionContext _sessionContext;

    public FileNotesRepository(IOptions<GameSettings> settings, ISessionContext sessionContext, string contentRootPath)
    {
        var logPath = settings.Value.LogPath;
        _logPath = Path.IsPathRooted(logPath) ? logPath : Path.Combine(contentRootPath, logPath);
        _sessionContext = sessionContext;
    }

    public async Task SaveAsync(string content)
    {
        var sessionPath = GetSessionPath();
        Directory.CreateDirectory(sessionPath);

        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm-ss");
        var filePath = Path.Combine(sessionPath, $"notes_{timestamp}.txt");
        var fileContent = $"Researcher Notes — {timestamp}\n\n{content}";
        await File.WriteAllTextAsync(filePath, fileContent);
    }

    private string GetSessionPath() =>
        _sessionContext.SessionFolder is { } folder
            ? Path.Combine(_logPath, folder)
            : _logPath;
}
