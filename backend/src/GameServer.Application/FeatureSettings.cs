using System.ComponentModel.DataAnnotations;

namespace GameServer.Application;

public class FeatureSettings
{
    public const string SectionName = "Features";
    public DashboardFeature Dashboard { get; set; } = new();
    public ScriptsModalFeature ScriptsModal { get; set; } = new();
    public NotesFeature Notes { get; set; } = new();
}

public class DashboardFeature
{
    public bool Active { get; set; } = true;
}

public class ScriptsModalFeature
{
    public bool Active { get; set; } = true;

    [Range(1, int.MaxValue, ErrorMessage = "TypingWpm must be at least 1.")]
    public int TypingWpm { get; set; } = 60;
}

public class NotesFeature
{
    public bool Active { get; set; } = true;
}
