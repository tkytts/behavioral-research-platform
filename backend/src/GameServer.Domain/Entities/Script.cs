using System.Text.Json.Serialization;

namespace GameServer.Domain.Entities;

/// <summary>
/// Represents a confederate script as defined in scripts.json.
/// </summary>
public class Script
{
    public required List<int> Orders { get; init; }

    [JsonPropertyName("message_groups")]
    public required Dictionary<string, MessageGroup> MessageGroups { get; init; }

    public required List<ScriptResolution> Resolutions { get; init; }
}

public class MessageGroup
{
    public required List<string> Messages { get; init; }
}

public class ScriptResolution
{
    public required int Problem { get; init; }
    public required string Resolution { get; init; }
}
