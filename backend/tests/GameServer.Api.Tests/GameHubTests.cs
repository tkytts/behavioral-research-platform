using FluentAssertions;
using GameServer.Application;
using GameServer.Application.DTOs;
using GameServer.Application.Interfaces;
using GameServer.Domain.Constants;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Xunit;

namespace GameServer.Api.Tests;

public class GameHubTests : IClassFixture<WebApplicationFactory<Program>>, IAsyncLifetime
{
    private readonly WebApplicationFactory<Program> _factory;
    private HubConnection? _connection;

    public GameHubTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private string ResolvedLogPath
    {
        get
        {
            var settings = _factory.Services.GetRequiredService<IOptions<GameSettings>>().Value;
            var env = _factory.Services.GetRequiredService<IHostEnvironment>();
            return Path.IsPathRooted(settings.LogPath)
                ? settings.LogPath
                : Path.Combine(env.ContentRootPath, settings.LogPath);
        }
    }

    public async Task InitializeAsync()
    {
        var client = _factory.CreateClient();
        _connection = new HubConnectionBuilder()
            .WithUrl(
                $"{client.BaseAddress}api/gamehub",
                options => options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler())
            .Build();

        await _connection.StartAsync();
    }

    public async Task DisposeAsync()
    {
        try
        {
            if (_connection is not null)
                await _connection.DisposeAsync();
        }
        finally
        {
            var gameService = _factory.Services.GetRequiredService<IGameService>();
            gameService.State.Reset();

            var sessionContext = _factory.Services.GetRequiredService<ISessionContext>();
            sessionContext.IsTutorial = false;
            sessionContext.SessionFolder = null;
        }
    }

    // Registers a handler before invoking an action and awaits the first matching event.
    // WARNING: HubConnection.On<T> appends a new handler on each call — it does not overwrite.
    // Call this at most once per event name per connection instance. Handlers are never
    // deregistered, so a second call for the same event name will cause the stale handler
    // from the first call to fire the new TCS.
    private static async Task<T> WaitForEventAsync<T>(HubConnection conn, string eventName,
        Func<Task> action, TimeSpan? timeout = null)
    {
        var tcs = new TaskCompletionSource<T>(TaskCreationOptions.RunContinuationsAsynchronously);
        conn.On<T>(eventName, val => tcs.TrySetResult(val));
        try { await action(); }
        catch (Exception ex) { tcs.TrySetException(ex); }
        return await tcs.Task.WaitAsync(timeout ?? TimeSpan.FromSeconds(5));
    }

    // Polls condition every 20 ms until it returns true or the timeout elapses.
    private static async Task PollUntilAsync(Func<bool> condition, TimeSpan? timeout = null, string? reason = null)
    {
        var deadline = DateTime.UtcNow + (timeout ?? TimeSpan.FromSeconds(5));
        bool result;
        while (!(result = condition()) && DateTime.UtcNow < deadline)
            await Task.Delay(20);
        result.Should().BeTrue(reason ?? "condition did not become true within the timeout");
    }

    [Fact]
    public async Task Connection_CanBeEstablished()
    {
        // Assert
        _connection!.State.Should().Be(HubConnectionState.Connected);
    }

    [Fact]
    public async Task SendMessage_BroadcastsToAll()
    {
        // Act & Assert
        var msg = await WaitForEventAsync<ChatMessageDto>(_connection!, "ReceiveMessage",
            () => _connection!.InvokeAsync("SendMessage", new ChatMessageDto("TestUser", "Hello!")));

        msg.Should().NotBeNull();
        msg.User.Should().Be("TestUser");
        msg.Text.Should().Be("Hello!");
    }

    [Fact]
    public async Task StartGame_BroadcastsStatusUpdate()
    {
        var status = await WaitForEventAsync<bool>(_connection!, "StatusUpdate",
            () => _connection!.InvokeAsync("StartGame"));

        status.Should().BeTrue();
    }

    [Fact]
    public async Task StopGame_BroadcastsStatusUpdate()
    {
        var status = await WaitForEventAsync<bool>(_connection!, "StatusUpdate",
            () => _connection!.InvokeAsync("StopGame"));

        status.Should().BeFalse();
    }

    [Fact]
    public async Task ResetPoints_BroadcastsZeroScore()
    {
        var score = await WaitForEventAsync<int>(_connection!, "PointsUpdate",
            () => _connection!.InvokeAsync("ResetPoints"));

        score.Should().Be(0);
    }

    [Fact]
    public async Task SetConfederate_BroadcastsNewConfederate()
    {
        var confederate = await WaitForEventAsync<string>(_connection!, "NewConfederate",
            () => _connection!.InvokeAsync("SetConfederate", "TestConfederate"));

        confederate.Should().Be("TestConfederate");
    }

    [Fact]
    public async Task BlockFinished_BroadcastsNewConfederate_WithInterrupts()
    {
        await _connection!.InvokeAsync("TelemetryEvent", new TelemetryEventDto("TestUser", null, TelemetryAction.Interrupt, null));
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("TestUser", null, TelemetryAction.Interrupt, null));

        var receivedConfederate = await WaitForEventAsync<string>(_connection!, "NewConfederate",
            () => _connection!.InvokeAsync("BlockFinished"));

        receivedConfederate.Should().Be(string.Empty);
    }

    [Fact]
    public async Task BlockFinished_SavesBlockInterruptsTelemetry()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "IntegrationUser");

        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("IntegrationUser", null, TelemetryAction.Interrupt, null));
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("IntegrationUser", null, TelemetryAction.Interrupt, null));
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("IntegrationUser", null, TelemetryAction.Interrupt, null));

        // Act
        await _connection.InvokeAsync("BlockFinished");

        // Assert
        await PollUntilAsync(() =>
        {
            var files = Directory.GetFiles(ResolvedLogPath, "*.csv", SearchOption.AllDirectories);
            var combined = string.Concat(files.Select(f => File.ReadAllText(f)));
            return combined.Contains(TelemetryAction.BlockInterrupts) && combined.Contains(",3,");
        }, reason: "telemetry file with BlockInterrupts and count 3 was not written");
    }

    [Fact]
    public async Task SetAnswer_BroadcastsAnswerToClients()
    {
        var answer = await WaitForEventAsync<string>(_connection!, "SetAnswer",
            () => _connection!.InvokeAsync("SetAnswer", "42"));

        answer.Should().Be("42");
    }

    [Fact]
    public async Task SetGameResolution_SavesTeamAnswerSetTelemetry()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "IntegrationUser");

        // Act
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("AP", "42"));

        // Assert
        await PollUntilAsync(() =>
        {
            var files = Directory.GetFiles(ResolvedLogPath, "*.csv", SearchOption.AllDirectories);
            var combined = string.Concat(files.Select(f => File.ReadAllText(f)));
            return combined.Contains(TelemetryAction.TeamAnswerSet) && combined.Contains(",,42");
        }, reason: "telemetry file with TeamAnswerSet was not written");
    }

    [Fact]
    public async Task SetGameResolution_DuplicateSubmission_DoesNotWriteExtraTelemetry()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "IntegrationUser");

        int CountRows(string answer)
        {
            var files = Directory.GetFiles(ResolvedLogPath, "*.csv", SearchOption.AllDirectories);
            var lines = files.SelectMany(f => File.ReadAllLines(f));
            return lines.Count(l => l.Contains(TelemetryAction.TeamAnswerSet) && l.Contains($",,{answer}"));
        }

        // Capture baseline (leftover rows from prior test runs)
        var baseline = CountRows("42");

        // Act — first submission
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("AP", "42"));
        await PollUntilAsync(() => CountRows("42") == baseline + 1,
            reason: "first TeamAnswerSet telemetry row was not written");

        // Act — duplicate submission
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("AP", "42"));
        // InvokeAsync returns after the hub method completes, so any telemetry write would already
        // be in-flight. A short delay lets the async repository flush before we assert absence.
        await Task.Delay(200);

        // Assert — count has not grown beyond baseline + 1
        CountRows("42").Should().Be(baseline + 1, "duplicate submission must not write a second telemetry row");
    }

    [Fact]
    public async Task SetGameResolution_DuplicateSubmission_StillBroadcastsSetAnswer()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "IntegrationUser");

        // First submission — handler intentionally not registered yet so we only capture the
        // duplicate broadcast below (deviates from WaitForEventAsync's register-then-invoke pattern).
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("AP", "42"));

        // Register handler before the duplicate call
        var tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        _connection.On<string>("SetAnswer", val => tcs.TrySetResult(val));

        // Act — duplicate submission
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("AP", "42"));

        // Assert — broadcast still fires
        var answer = await tcs.Task.WaitAsync(TimeSpan.FromSeconds(5));
        answer.Should().Be("42");
    }

    [Fact]
    public async Task SetGameResolution_ChangedAnswer_WritesNewTelemetry()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "IntegrationUser");

        // First submission
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("AP", "42"));
        await PollUntilAsync(() =>
        {
            var files = Directory.GetFiles(ResolvedLogPath, "*.csv", SearchOption.AllDirectories);
            var combined = string.Concat(files.Select(f => File.ReadAllText(f)));
            return combined.Contains(TelemetryAction.TeamAnswerSet) && combined.Contains(",,42");
        }, reason: "first TeamAnswerSet telemetry was not written");

        // Act — different answer
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("AP", "99"));

        // Assert — new row appears
        await PollUntilAsync(() =>
        {
            var files = Directory.GetFiles(ResolvedLogPath, "*.csv", SearchOption.AllDirectories);
            var combined = string.Concat(files.Select(f => File.ReadAllText(f)));
            return combined.Contains(TelemetryAction.TeamAnswerSet) && combined.Contains(",,99");
        }, reason: "second TeamAnswerSet telemetry row for answer '99' was not written");
    }

    [Fact]
    public async Task SetParticipantName_RoutesSubsequentTelemetryIntoSessionSubfolder()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "Alice");

        // Act
        await _connection.InvokeAsync("TelemetryEvent", new TelemetryEventDto("Alice", null, TelemetryAction.Edit, null));

        // Assert
        await PollUntilAsync(() =>
        {
            var subfolders = Directory.GetDirectories(ResolvedLogPath, "Alice_*");
            return subfolders.Length > 0 && Directory.GetFiles(subfolders[0], "*.csv").Length > 0;
        }, reason: "session subfolder was not created");
    }

    [Fact]
    public async Task Typing_NotifiesOtherClients()
    {
        // Arrange - Create second connection
        var client = _factory.CreateClient();
        var connection2 = new HubConnectionBuilder()
            .WithUrl(
                $"{client.BaseAddress}api/gamehub",
                options => options.HttpMessageHandlerFactory = _ => _factory.Server.CreateHandler())
            .Build();
        await connection2.StartAsync();

        // Act & Assert
        var typingUser = await WaitForEventAsync<string>(connection2, "UserTyping",
            () => _connection!.InvokeAsync("Typing", "User1"));

        typingUser.Should().Be("User1");

        // Cleanup
        await connection2.DisposeAsync();
    }

    [Fact]
    public async Task BlockFinished_StopsRunningTimer()
    {
        // Arrange: start the timer so it is running
        await _connection!.InvokeAsync("StartTimer");
        var timerService = _factory.Services.GetRequiredService<ITimerService>();
        await PollUntilAsync(() => timerService.IsRunning, reason: "timer did not start");

        // Act
        await _connection.InvokeAsync("BlockFinished");

        // Assert: timer must be stopped after block ends
        await PollUntilAsync(() => !timerService.IsRunning, reason: "timer did not stop after BlockFinished");
    }

    [Fact]
    public async Task BlockFinished_ClearsPendingResolutionAndTeamAnswer()
    {
        // Arrange: set a pending resolution to simulate mid-block state
        var gameService = _factory.Services.GetRequiredService<IGameService>();
        await _connection!.InvokeAsync("SetGameResolution",
            new SetGameResolutionDto("AP", "someAnswer"));
        // InvokeAsync completes only after the hub method returns, so state is fully written — no polling needed.
        gameService.State.PendingResolutionType.Should().NotBeNull();
        gameService.State.TeamAnswer.Should().Be("someAnswer");

        // Act
        await _connection.InvokeAsync("BlockFinished");

        // Assert: stale resolution state must be wiped before next block
        gameService.State.PendingResolutionType.Should().BeNull();
        gameService.State.TeamAnswer.Should().BeNull();
    }

    [Fact]
    public async Task BlockFinished_ClearsConfederateName()
    {
        // Arrange: simulate a stale confederate name from the previous block
        var gameService = _factory.Services.GetRequiredService<IGameService>();
        gameService.State.ConfederateName = "Camila";

        // Act
        await _connection!.InvokeAsync("BlockFinished");

        // Assert: polling endpoint must return "" during inter-block interval
        gameService.State.ConfederateName.Should().BeNull();
    }

    [Fact]
    public async Task StartTutorial_SetsIsTutorialTrue()
    {
        // Act
        await _connection!.InvokeAsync("StartTutorial");

        // Assert
        var sessionContext = _factory.Services.GetRequiredService<ISessionContext>();
        sessionContext.IsTutorial.Should().BeTrue();
    }

    [Fact]
    public async Task StartGame_ResetsIsTutorialToFalse()
    {
        // Arrange: mark session as tutorial first
        await _connection!.InvokeAsync("StartTutorial");
        var sessionContext = _factory.Services.GetRequiredService<ISessionContext>();
        sessionContext.IsTutorial.Should().BeTrue();

        // Act
        await _connection.InvokeAsync("StartGame");

        // Assert
        sessionContext.IsTutorial.Should().BeFalse();
    }

    [Fact]
    public async Task StartTutorial_SuppressesTelemetry()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "TutorialUser");
        await _connection.InvokeAsync("StartTutorial");

        // Act
        await _connection.InvokeAsync("TelemetryEvent",
            new TelemetryEventDto("TutorialUser", null, TelemetryAction.Edit, null));

        // Absence assertion: wait briefly to confirm no file was written.
        // Cannot use PollUntilAsync because the condition is never expected to become true.
        await Task.Delay(500);

        // Assert: no CSV file should be written during tutorial
        var subfolders = Directory.GetDirectories(ResolvedLogPath, "TutorialUser_*");
        var files = subfolders.Length > 0
            ? Directory.GetFiles(subfolders[0], "*.csv")
            : Directory.GetFiles(ResolvedLogPath, "*TutorialUser*.csv");
        files.Should().BeEmpty();
    }

    [Fact]
    public async Task TutorialDone_ClearsConfederateName()
    {
        // Arrange: simulate a stale confederate name from the tutorial (e.g. "Julio")
        var gameService = _factory.Services.GetRequiredService<IGameService>();
        gameService.State.ConfederateName = "Julio";

        // Act & Assert
        var receivedConfederate = await WaitForEventAsync<string>(_connection!, "NewConfederate",
            () => _connection!.InvokeAsync("TutorialDone", 1));

        gameService.State.ConfederateName.Should().BeNull();
        receivedConfederate.Should().Be(string.Empty);
    }

    [Fact]
    public async Task UpdateProblemSelection_SavesStartingProblemOverrideTelemetry_WhenProblemIndexIsNonZero()
    {
        // Arrange
        await _connection!.InvokeAsync("SetParticipantName", "OverrideUser");

        // Act
        await _connection.InvokeAsync("UpdateProblemSelection", new ProblemSelectionDto(0, 2));

        // Assert
        await PollUntilAsync(() =>
        {
            var files = Directory.GetFiles(ResolvedLogPath, "*.csv", SearchOption.AllDirectories);
            var combined = string.Concat(files.Select(f => File.ReadAllText(f)));
            return combined.Contains(TelemetryAction.StartingProblemOverride) && combined.Contains(",2,");
        }, reason: "telemetry file with StartingProblemOverride was not written");
    }

    // ── Negative tests ────────────────────────────────────────────────────────

    [Fact]
    public async Task StartGame_WithNoParticipantNameSet_WritesTelemetryWithUnknownUser()
    {
        // Arrange: clear participant name to simulate a game started before a participant connects
        var gameService = _factory.Services.GetRequiredService<IGameService>();
        gameService.State.ParticipantName = null;

        // Act
        await _connection!.InvokeAsync("StartGame");

        // Assert: telemetry should fall back to "Unknown" when no participant name is set
        await PollUntilAsync(() =>
        {
            var files = Directory.GetFiles(ResolvedLogPath, "*.csv", SearchOption.AllDirectories);
            var combined = string.Concat(files.Select(f => File.ReadAllText(f)));
            var lines = combined.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            return lines.Any(line => line.StartsWith("Unknown,") && line.Contains(TelemetryAction.NewGame));
        }, reason: "telemetry file with NewGame and Unknown user was not written");
    }

    [Fact]
    public async Task SetGameResolution_WithInvalidResolutionType_DoesNotBroadcastSetAnswer()
    {
        // Arrange
        var tcs = new TaskCompletionSource<string>(TaskCreationOptions.RunContinuationsAsynchronously);
        _connection!.On<string>("SetAnswer", val => tcs.TrySetResult(val));

        // Act
        await _connection.InvokeAsync("SetGameResolution", new SetGameResolutionDto("INVALID_TYPE", "some answer"));

        // Absence assertion: xUnit runs tests within a class sequentially by default,
        // so no in-class test can fire a concurrent broadcast. The 500 ms wait is a
        // pragmatic upper bound — there is no signal-based alternative for "event never fires".
        // If [Collection] or parallel test execution is ever added, revisit this test.
        var fired = await Task.WhenAny(tcs.Task, Task.Delay(500)) == tcs.Task;
        fired.Should().BeFalse("invalid resolution type should not trigger a SetAnswer broadcast");
    }

    [Fact]
    public async Task SetParticipantName_WithEmptyString_IsNoOp()
    {
        // Arrange: set a known name first so the guard can be verified
        await _connection!.InvokeAsync("SetParticipantName", "Alice");
        var gameService = _factory.Services.GetRequiredService<IGameService>();
        var sessionContext = _factory.Services.GetRequiredService<ISessionContext>();
        gameService.State.ParticipantName.Should().Be("Alice");
        sessionContext.SessionFolder.Should().NotBeNull();

        // Act: calling with empty string should be a no-op
        await _connection.InvokeAsync("SetParticipantName", string.Empty);

        // Assert: connection remains open, state is unchanged
        _connection.State.Should().Be(HubConnectionState.Connected);
        gameService.State.ParticipantName.Should().Be("Alice");
        sessionContext.SessionFolder.Should().NotBeNull();
    }

    [Fact]
    public async Task SetParticipantName_SetsSessionFolderWithIsoDate()
    {
        // Act
        await _connection!.InvokeAsync("SetParticipantName", "Alice");

        // Assert: folder should contain yyyy-MM-dd date format
        var sessionContext = _factory.Services.GetRequiredService<ISessionContext>();
        sessionContext.SessionFolder.Should().MatchRegex(@"^Alice_\d{4}-\d{2}-\d{2}$");
    }

    // ── Auth gating tests ──────────────────────────────────────────────────────
    // These tests override the config to set a non-empty ExperimenterKey.

    [Fact]
    public async Task RegisterExperimenter_ReturnsFalse_WhenKeyIsWrong()
    {
        using var factory = _factory.WithWebHostBuilder(b =>
            b.UseSetting("Game:ExperimenterKey", "secret"));
        var client = factory.CreateClient();
        await using var conn = new HubConnectionBuilder()
            .WithUrl($"{client.BaseAddress}api/gamehub",
                o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        await conn.StartAsync();

        var result = await conn.InvokeAsync<bool>("RegisterExperimenter", "wrong");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task RegisterExperimenter_ReturnsTrue_WhenKeyIsCorrect()
    {
        using var factory = _factory.WithWebHostBuilder(b =>
            b.UseSetting("Game:ExperimenterKey", "secret"));
        var client = factory.CreateClient();
        await using var conn = new HubConnectionBuilder()
            .WithUrl($"{client.BaseAddress}api/gamehub",
                o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        await conn.StartAsync();

        var result = await conn.InvokeAsync<bool>("RegisterExperimenter", "secret");

        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExperimenterMethod_ThrowsHubException_WhenKeyConfiguredAndNotRegistered()
    {
        using var factory = _factory.WithWebHostBuilder(b =>
            b.UseSetting("Game:ExperimenterKey", "secret"));
        var client = factory.CreateClient();
        await using var conn = new HubConnectionBuilder()
            .WithUrl($"{client.BaseAddress}api/gamehub",
                o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        await conn.StartAsync();

        // StartGame is experimenter-only and should throw when not registered
        var act = async () => await conn.InvokeAsync("StartGame");
        await act.Should().ThrowAsync<HubException>().WithMessage("*Not authorized*");
    }

    [Fact]
    public async Task ExperimenterMethod_Succeeds_AfterRegisterExperimenter()
    {
        using var factory = _factory.WithWebHostBuilder(b =>
            b.UseSetting("Game:ExperimenterKey", "secret"));
        var client = factory.CreateClient();
        await using var conn = new HubConnectionBuilder()
            .WithUrl($"{client.BaseAddress}api/gamehub",
                o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        await conn.StartAsync();

        await conn.InvokeAsync<bool>("RegisterExperimenter", "secret");

        // Should not throw
        var status = await WaitForEventAsync<bool>(conn, "StatusUpdate",
            () => conn.InvokeAsync("StartGame"));
        status.Should().BeTrue();
    }

    [Fact]
    public async Task TutorialSharedMethod_Succeeds_WhenIsTutorialWithoutRegistration()
    {
        using var factory = _factory.WithWebHostBuilder(b =>
            b.UseSetting("Game:ExperimenterKey", "secret"));
        var client = factory.CreateClient();
        await using var conn = new HubConnectionBuilder()
            .WithUrl($"{client.BaseAddress}api/gamehub",
                o => o.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler())
            .Build();
        await conn.StartAsync();

        // StartTutorial is open; it sets IsTutorial = true
        await conn.InvokeAsync("StartTutorial");

        // SetMaxTime is tutorial-shared — should succeed without registration when IsTutorial is true
        var act = async () => await conn.InvokeAsync("SetMaxTime", 60);
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task StartTutorial_IsRejected_WhenGameIsLive()
    {
        // Arrange: start the game (auth disabled with default empty key)
        await _connection!.InvokeAsync("StartGame");
        var gameService = _factory.Services.GetRequiredService<IGameService>();
        gameService.State.IsLive.Should().BeTrue();

        // Act: StartTutorial should be a no-op (not throw, but IsTutorial stays false)
        await _connection.InvokeAsync("StartTutorial");

        // Assert
        var sessionContext = _factory.Services.GetRequiredService<ISessionContext>();
        sessionContext.IsTutorial.Should().BeFalse();
    }

    [Fact]
    public async Task AllMethods_WorkWithoutRegistration_WhenKeyIsEmpty()
    {
        // Default factory uses empty ExperimenterKey (auth disabled)
        // Verify that experimenter-only method works without registration
        var status = await WaitForEventAsync<bool>(_connection!, "StatusUpdate",
            () => _connection!.InvokeAsync("StartGame"));
        status.Should().BeTrue();
    }
}
