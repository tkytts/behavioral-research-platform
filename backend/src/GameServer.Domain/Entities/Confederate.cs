namespace GameServer.Domain.Entities;

/// <summary>
/// Represents a confederate as defined in confederates_f.json / confederates_m.json.
/// </summary>
public class Confederate
{
    public required int Order { get; init; }
    public required string Name { get; init; }
    public required string Gender { get; init; }
}
