namespace GameServer.Application.Interfaces;

public interface ISessionContext
{
    string? SessionFolder { get; set; }
    bool IsTutorial { get; set; }

    /// <summary>
    /// Initializes the session folder for the given participant name.
    /// </summary>
    void BeginSession(string participantName);
}
