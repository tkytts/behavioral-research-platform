using GameServer.Application.Interfaces;

namespace GameServer.Application;

public class SessionContext : ISessionContext
{
    public string? SessionFolder { get; set; }
}
