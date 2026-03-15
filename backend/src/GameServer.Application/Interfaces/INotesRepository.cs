namespace GameServer.Application.Interfaces;

public interface INotesRepository
{
    Task SaveAsync(string content);
}
