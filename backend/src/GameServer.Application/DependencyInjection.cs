using GameServer.Application.Interfaces;
using GameServer.Application.Services;
using GameServer.Domain.Entities;
using Microsoft.Extensions.DependencyInjection;

namespace GameServer.Application;

/// <summary>
/// Extension methods for registering Application layer services.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Register GameState as singleton (shared across all connections)
        services.AddSingleton<GameState>();

        // Register services
        services.AddSingleton<IGameService, GameService>();
        services.AddSingleton<IChatService, ChatService>();
        services.AddSingleton<ITimerService, TimerService>();

        return services;
    }
}
