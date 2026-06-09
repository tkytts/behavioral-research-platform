namespace GameServer.Application.Interfaces;

public interface ISuggestionRepository
{
    Task<IReadOnlyList<IReadOnlyList<string>>> GetAllAsync();
}
