using GameServer.Application.Interfaces;
using GameServer.Infrastructure.Repositories;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using GameServer.Application;

namespace GameServer.Infrastructure;

/// <summary>
/// Extension methods for registering Infrastructure layer services.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, string contentRootPath)
    {
        services.AddSingleton<ISessionContext, SessionContext>();

        services.AddSingleton<IBlockRepository>(_ =>
            new JsonBlockRepository(Path.Combine(contentRootPath, "Resources/blocks.json")));

        services.AddSingleton<IConfederateRepository>(_ =>
            new JsonConfederateRepository(
                Path.Combine(contentRootPath, "Resources/confederates_f.json"),
                Path.Combine(contentRootPath, "Resources/confederates_m.json")));

        services.AddSingleton<IScriptRepository>(_ =>
            new JsonScriptRepository(Path.Combine(contentRootPath, "Resources/scripts.json")));

        services.AddSingleton<ISuggestionRepository>(_ =>
            new JsonSuggestionRepository(Path.Combine(contentRootPath, "Resources/suggestions.json")));

        services.AddSingleton<ITelemetryRepository>(sp =>
            new CsvTelemetryRepository(
                sp.GetRequiredService<IOptions<GameSettings>>(),
                sp.GetRequiredService<ISessionContext>(),
                contentRootPath));

        services.AddSingleton<IChatLogRepository>(sp =>
            new FileChatLogRepository(
                sp.GetRequiredService<IOptions<GameSettings>>(),
                sp.GetRequiredService<ISessionContext>(),
                contentRootPath));

        services.AddSingleton<INotesRepository>(sp =>
            new FileNotesRepository(
                sp.GetRequiredService<IOptions<GameSettings>>(),
                sp.GetRequiredService<ISessionContext>(),
                contentRootPath));

        return services;
    }
}
