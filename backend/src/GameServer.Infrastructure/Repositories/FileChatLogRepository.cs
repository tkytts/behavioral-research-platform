using GameServer.Application;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using Microsoft.Extensions.Options;

namespace GameServer.Infrastructure.Repositories;

/// <summary>
/// Repository that saves chat logs to text files.
/// </summary>
public class FileChatLogRepository : IChatLogRepository
{
    private readonly string _logPath;
    private readonly ISessionContext _sessionContext;

    public FileChatLogRepository(IOptions<GameSettings> settings, ISessionContext sessionContext, string contentRootPath)
    {
        var logPath = settings.Value.LogPath;
        _logPath = Path.IsPathRooted(logPath) ? logPath : Path.Combine(contentRootPath, logPath);
        _sessionContext = sessionContext;
        Directory.CreateDirectory(_logPath);
    }

    public async Task SaveAsync(IReadOnlyList<Message> messages)
    {
        if (messages.Count == 0) return;

        var sessionPath = GetSessionPath();
        Directory.CreateDirectory(sessionPath);

        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm-ss");
        var filePath = Path.Combine(sessionPath, $"chat_logs_{timestamp}.txt");

        var content = $"Chat Log - {timestamp}\n\n" +
            string.Join("\n", messages.Select(m =>
                $"{m.FormattedTimestamp} - {m.User}: {m.Text}"));

        await File.WriteAllTextAsync(filePath, content);
    }

    public async Task SaveTutorialLogAsync(int numberOfTries)
    {
        var sessionPath = GetSessionPath();
        Directory.CreateDirectory(sessionPath);

        var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd_HH-mm-ss");
        var filePath = Path.Combine(sessionPath, $"tutorial_logs_{timestamp}.txt");

        var content = $"Tutorial Log - {timestamp}\n\nTries: {numberOfTries}";
        await File.WriteAllTextAsync(filePath, content);
    }

    private string GetSessionPath() =>
        _sessionContext.SessionFolder is { } folder
            ? Path.Combine(_logPath, folder)
            : _logPath;
}
