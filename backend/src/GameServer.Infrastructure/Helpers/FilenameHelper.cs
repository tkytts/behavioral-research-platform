namespace GameServer.Infrastructure.Helpers;

public static class FilenameHelper
{
    public static string SanitizeForFilename(string? name)
    {
        if (string.IsNullOrEmpty(name))
            return "unknown";

        var invalid = Path.GetInvalidFileNameChars()
            .Concat(new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar })
            .ToHashSet();

        return new string(name.Where(c => !invalid.Contains(c)).ToArray())
            .Replace("..", string.Empty)
            .Trim();
    }
}
