using GameServer.Application.Interfaces;
using GameServer.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace GameServer.Infrastructure;

/// <summary>
/// Extension methods for registering Infrastructure layer services.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddSingleton<IBlockRepository, JsonBlockRepository>();
        services.AddSingleton<ITelemetryRepository, CsvTelemetryRepository>();
        services.AddSingleton<IChatLogRepository, FileChatLogRepository>();
        services.AddSingleton<INotesRepository, FileNotesRepository>();

        return services;
    }
}
