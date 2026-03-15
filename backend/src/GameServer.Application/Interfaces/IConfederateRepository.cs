using GameServer.Domain.Entities;

namespace GameServer.Application.Interfaces;

public interface IConfederateRepository
{
    Task<List<Confederate>> GetFemaleAsync();
    Task<List<Confederate>> GetMaleAsync();
}
