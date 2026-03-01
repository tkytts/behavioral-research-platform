namespace GameServer.Domain.Enums;

/// <summary>
/// Represents the action type for a telemetry event.
/// </summary>
public enum TelemetryAction
{
    /// <summary>An edit interaction.</summary>
    Edit,

    /// <summary>A message sent by the participant.</summary>
    MessageSent,

    /// <summary>A participant interrupt action.</summary>
    Interrupt,

    /// <summary>A message sent by the confederate.</summary>
    ConfederateMessage,

    /// <summary>Navigation to the next problem.</summary>
    NextProblem,

    /// <summary>A new game was started.</summary>
    NewGame,

    /// <summary>A game round was resolved.</summary>
    GameResolved,
}

public static class TelemetryActionExtensions
{
    public static string ToActionString(this TelemetryAction action) => action switch
    {
        TelemetryAction.Edit              => "edit",
        TelemetryAction.MessageSent       => "message sent",
        TelemetryAction.Interrupt         => "INTERRUPT",
        TelemetryAction.ConfederateMessage => "CONFEDERATE MESSAGE",
        TelemetryAction.NextProblem       => "next problem",
        TelemetryAction.NewGame           => "NEW GAME",
        TelemetryAction.GameResolved      => "game resolved",
        _ => throw new ArgumentOutOfRangeException(nameof(action), action, null)
    };

    public static TelemetryAction ParseActionString(string value) => value switch
    {
        "edit"                => TelemetryAction.Edit,
        "message sent"        => TelemetryAction.MessageSent,
        "INTERRUPT"           => TelemetryAction.Interrupt,
        "CONFEDERATE MESSAGE" => TelemetryAction.ConfederateMessage,
        "next problem"        => TelemetryAction.NextProblem,
        "NEW GAME"            => TelemetryAction.NewGame,
        "game resolved"       => TelemetryAction.GameResolved,
        _ => throw new ArgumentException($"Unknown telemetry action: '{value}'", nameof(value))
    };
}
