# GameServer Backend

A real-time multiplayer game server built with .NET 8, SignalR, and clean architecture principles. Originally designed for research data collection in collaborative problem-solving studies.

## Quick Start

```bash
cd backend
dotnet restore
dotnet run --project src/GameServer.Api
```

The server starts at `http://localhost:5000` (HTTPS: `https://localhost:5001`)

## Architecture

This solution follows **Clean Architecture** principles:

```
┌──────────────────────────────────────────────────────────┐
│                    GameServer.Api                        │
│            (Controllers, SignalR Hubs)                   │
└──────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                 GameServer.Application                   │
│        (Services, DTOs, Interfaces, Business Logic)      │
└──────────────────────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
┌─────────────────────────┐  ┌─────────────────────────────┐
│   GameServer.Domain     │  │  GameServer.Infrastructure  │
│  (Entities, Enums)      │  │  (Repositories, File I/O)   │
└─────────────────────────┘  └─────────────────────────────┘
```

### Project Structure

```
backend/
├── src/
│   ├── GameServer.Api/            # Web API and SignalR hub
│   ├── GameServer.Application/    # Business logic and DTOs
│   ├── GameServer.Domain/         # Core entities and enums
│   └── GameServer.Infrastructure/ # Data access and file I/O
└── tests/
    ├── GameServer.Api.Tests/
    ├── GameServer.Application.Tests/
    └── GameServer.Infrastructure.Tests/
```

## Features

- **Real-time Communication**: SignalR hub for instant message broadcasting
- **Game State Management**: Centralized `GameState` class with thread-safe operations
- **Problem Navigation**: Block/problem selection with configurable content
- **Scoring System**: Points tracking with multiple resolution types
- **Timer System**: Configurable countdown with timeout handling
- **Telemetry**: CSV logging for research data collection
- **Chat System**: Real-time messaging with persistence

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blocks` | Get all game blocks |
| GET | `/api/suggestions` | Get problem suggestions |
| GET | `/api/currentUser` | Get current participant name |
| GET | `/api/game/confederate` | Get current confederate name |
| GET | `/api/confederates` | Get confederate name lists |
| GET | `/api/scripts` | Get typing simulation scripts |
| GET | `/api/config/features` | Get feature toggle configuration |

### SignalR Hub (`/api/gamehub`)

#### Client → Server Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `SetParticipantName` | `string name` | Set participant name |
| `SetConfederate` | `string name` | Set confederate name |
| `SendMessage` | `ChatMessageDto` | Send chat message |
| `Typing` | `string username` | Notify typing |
| `ClearChat` | - | Clear and save chat |
| `UpdateProblemSelection` | `ProblemSelectionDto` | Update current problem selection |
| `FirstBlock` | - | Go to first block |
| `NextBlock` | - | Go to next block |
| `NextProblem` | - | Go to next problem |
| `TutorialProblem` | `ProblemUpdateDto` | Send tutorial problem update |
| `StartTimer` | - | Start countdown |
| `StopTimer` | - | Stop countdown |
| `ResetTimer` | - | Reset countdown |
| `SetMaxTime` | `int time` | Set timer duration |
| `StartGame` | - | Start game session |
| `StopGame` | - | Stop game session |
| `SetGameResolution` | `SetGameResolutionDto` | Set resolution type and answer |
| `ResetPoints` | - | Reset score to zero |
| `SetPointsAwarded` | `int points` | Set points per correct answer |
| `ClearAnswer` | - | Clear answer display |
| `SetAnswer` | `string answer` | Set answer display |
| `BlockFinished` | - | Signal block completion |
| `GameEnded` | - | Signal game end |
| `SetChimes` | `ChimesConfigDto` | Set chimes configuration |
| `GetChimes` | - | Broadcast chimes config |
| `TelemetryEvent` | `TelemetryEventDto` | Save telemetry event |
| `TutorialDone` | `int numTries` | Record tutorial completion |

#### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ReceiveMessage` | `ChatMessageDto` | New chat message |
| `UserTyping` | `string` | User is typing |
| `ChatCleared` | - | Chat was cleared |
| `ProblemUpdate` | `ProblemUpdateDto` | Problem changed |
| `TimerUpdate` | `int` | Timer tick |
| `StatusUpdate` | `bool` | Game live status |
| `GameResolved` | `GameResolutionDto` | Round resolved (sent by timer service) |
| `PointsUpdate` | `int` | Score changed |
| `NewConfederate` | `string` | Confederate changed |
| `SetAnswer` | `string` | Answer display updated |
| `ShowEndModal` | - | Game ended, show end screen |
| `ChimesUpdated` | `ChimesConfigDto` | Chimes configuration updated |
| `TutorialDone` | `int` | Tutorial completed with try count |

## Configuration

Edit `src/GameServer.Api/appsettings.json`:

```json
{
  "Game": {
    "MaxTime": 120,
    "PointsAwarded": 7,
    "LogPath": "logs"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173"
    ]
  },
  "Features": {
    "Dashboard": { "Active": true },
    "ScriptsModal": { "Active": true, "TypingWpm": 60 },
    "Notes": { "Active": true }
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `Game:MaxTime` | 120 | Timer duration in seconds |
| `Game:PointsAwarded` | 7 | Points per correct answer |
| `Game:LogPath` | logs | Directory for CSV/log files |
| `Cors:AllowedOrigins` | - | Allowed frontend URLs |
| `Features:Dashboard:Active` | true | Enable experimenter dashboard |
| `Features:ScriptsModal:Active` | true | Enable scripts typing modal |
| `Features:ScriptsModal:TypingWpm` | 60 | Typing simulation speed (WPM) |
| `Features:Notes:Active` | true | Enable experimenter notes |

## Testing

```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test --collect:"XPlat Code Coverage"

# Run specific test project
dotnet test tests/GameServer.Application.Tests
```

### Test Projects

| Project | Description |
|---------|-------------|
| `GameServer.Api.Tests` | Controller and SignalR hub tests |
| `GameServer.Application.Tests` | Service and business logic tests |
| `GameServer.Infrastructure.Tests` | Repository and file I/O tests |

### Test Frameworks

- **xUnit**: Test runner
- **FluentAssertions**: Readable assertions
- **NSubstitute**: Mocking

## Design Decisions

1. **Singleton GameState**: Shared across all SignalR connections for consistent state
2. **Repository Pattern**: Abstracts file I/O for testability
3. **Options Pattern**: Strongly-typed configuration
4. **Thread-Safe State**: Locking in GameState for concurrent access
5. **CSV Logging**: Research-friendly output format (one file per user per day)

## Related Documentation

- [Project Overview](../README.md)
- [Frontend README](../frontend/README.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## License

MIT
