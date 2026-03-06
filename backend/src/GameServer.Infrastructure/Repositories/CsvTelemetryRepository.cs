using System.Collections.Concurrent;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using GameServer.Application;
using GameServer.Application.Interfaces;
using GameServer.Domain.Entities;
using GameServer.Domain.Constants;
using Microsoft.Extensions.Options;

namespace GameServer.Infrastructure.Repositories;

/// <summary>
/// Repository that saves telemetry data to CSV files.
/// One file per user per day, as required for research data collection.
/// </summary>
public class CsvTelemetryRepository : ITelemetryRepository
{
    private readonly string _logPath;
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _fileLocks = new();

    public CsvTelemetryRepository(IOptions<GameSettings> settings)
    {
        _logPath = settings.Value.LogPath;
        EnsureDirectoryExists();
    }

    public async Task SaveAsync(TelemetryEvent telemetryEvent)
    {
        var isConfederateMessage = telemetryEvent.Action == TelemetryAction.ConfederateMessage;
        var user = isConfederateMessage
            ? (telemetryEvent.Confederate ?? telemetryEvent.User)
            : telemetryEvent.User;
        var date = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var filePath = Path.Combine(_logPath, $"telemetry_data_{SanitizeForFilename(user)}_{date}.csv");

        var fileLock = _fileLocks.GetOrAdd(filePath, _ => new SemaphoreSlim(1, 1));
        await fileLock.WaitAsync();
        try
        {
            var fileExists = File.Exists(filePath);

            var config = new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true
            };

            await using var stream = new FileStream(
                filePath,
                FileMode.Append,
                FileAccess.Write,
                FileShare.Read);

            await using var writer = new StreamWriter(stream);
            await using var csv = new CsvWriter(writer, config);

            if (!fileExists)
            {
                csv.WriteHeader<TelemetryRecord>();
                await csv.NextRecordAsync();
            }

            var record = new TelemetryRecord
            {
                User = telemetryEvent.User,
                Confederate = telemetryEvent.Confederate ?? string.Empty,
                Action = telemetryEvent.Action,
                Text = telemetryEvent.Text ?? string.Empty,
                Timestamp = telemetryEvent.Timestamp.ToString("O"),
                X = telemetryEvent.X?.ToString() ?? string.Empty,
                Y = telemetryEvent.Y?.ToString() ?? string.Empty,
                Resolution = telemetryEvent.Resolution ?? string.Empty,
                Answer = telemetryEvent.Answer ?? string.Empty
            };

            csv.WriteRecord(record);
            await csv.NextRecordAsync();
        }
        finally
        {
            fileLock.Release();
        }
    }


    private static string SanitizeForFilename(string? name)
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

    private void EnsureDirectoryExists()
    {
        if (!Directory.Exists(_logPath))
        {
            Directory.CreateDirectory(_logPath);
        }
    }

    /// <summary>
    /// Internal record for CSV serialization with proper column headers.
    /// </summary>
    private sealed class TelemetryRecord
    {
        public string User { get; init; } = string.Empty;
        public string Confederate { get; init; } = string.Empty;
        public string Action { get; init; } = string.Empty;
        public string Text { get; init; } = string.Empty;
        public string Timestamp { get; init; } = string.Empty;
        public string X { get; init; } = string.Empty;
        public string Y { get; init; } = string.Empty;
        public string Resolution { get; init; } = string.Empty;
        public string Answer { get; init; } = string.Empty;
    }
}
