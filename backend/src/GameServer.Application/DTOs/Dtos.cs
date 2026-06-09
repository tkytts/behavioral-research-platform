namespace GameServer.Application.DTOs;

/// <summary>
/// DTO for the current participant user.
/// </summary>
public record CurrentUserDto(string? Name);

/// <summary>
/// DTO for chat messages sent via SignalR.
/// </summary>
public record ChatMessageDto(string User, string Text, string? Timestamp = null);

/// <summary>
/// DTO for problem updates.
/// </summary>
public record ProblemUpdateDto(BlockDto? Block, string Problem);

/// <summary>
/// DTO for block data.
/// </summary>
public record BlockDto(string Name);

/// <summary>
/// DTO for problem data.
/// </summary>
public record ProblemDto(string Id, string Question, string Answer, string? ImageUrl);

/// <summary>
/// DTO for game resolution result.
/// </summary>
public record GameResolutionDto(
    bool IsAnswerCorrect,
    int PointsAwarded,
    int CurrentScore,
    string? TeamAnswer);

/// <summary>
/// DTO for setting game resolution.
/// </summary>
public record SetGameResolutionDto(string GameResolutionType, string? TeamAnswer);

/// <summary>
/// DTO for problem selection.
/// </summary>
public record ProblemSelectionDto(int BlockIndex, int ProblemIndex);

/// <summary>
/// DTO for chimes configuration.
/// </summary>
public record ChimesConfigDto(bool MessageSent, bool MessageReceived, bool Timer);

/// <summary>
/// DTO for telemetry events.
/// </summary>
public record TelemetryEventDto(
    string User,
    string? Confederate,
    string Action,
    string? Text,
    double? X = null,
    double? Y = null,
    string? Resolution = null,
    DateTime? Timestamp = null);
