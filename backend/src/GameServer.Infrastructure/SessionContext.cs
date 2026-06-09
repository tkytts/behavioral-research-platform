using GameServer.Application.Interfaces;
using GameServer.Infrastructure.Helpers;

namespace GameServer.Infrastructure;

public class SessionContext : ISessionContext
{
    public string? SessionFolder { get; set; }
    public bool IsTutorial { get; set; }

    public void BeginSession(string participantName)
    {
        SessionFolder = $"{FilenameHelper.SanitizeForFilename(participantName)}_{DateTime.UtcNow:yyyy-MM-dd}";
    }
}
