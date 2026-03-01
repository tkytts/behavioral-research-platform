namespace GameServer.Domain.Entities;

/// <summary>
/// Represents a telemetry event for research data collection.
/// </summary>
public class TelemetryEvent
{
    public required string User { get; init; }
    public string? Confederate { get; init; }
    public required string Action { get; init; }
    public string? Text { get; init; }
    public DateTime Timestamp { get; init; } = DateTime.UtcNow;
    public double? X { get; init; }
    public double? Y { get; init; }
    public string? Resolution { get; init; }
    public string? Answer { get; init; }
}
