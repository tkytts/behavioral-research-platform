using GameServer.Domain.Entities;

namespace GameServer.Application.Interfaces;

public interface IScriptRepository
{
    Task<Script?> GetByOrderAsync(int order);
}
