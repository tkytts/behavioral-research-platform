using GameServer.Domain.Enums;

namespace GameServer.Domain.Entities;

/// <summary>
/// Represents the result of resolving a game round.
/// </summary>
public record GameResolution
{
    public required bool IsAnswerCorrect { get; init; }
    public required int PointsAwarded { get; init; }
    public required int CurrentScore { get; init; }
    public string? TeamAnswer { get; init; }
    public GameResolutionType ResolutionType { get; init; }
}
