# Interrupt Counter Per Block

## Overview

Track how many times the participant interrupts the confederate during each block. When a block ends, emit a telemetry event recording the total interrupt count for that block.

## Background

The frontend already detects interrupts: when a participant sends a message while the confederate is typing (`typingUser !== ""`), a telemetry event with `action: "INTERRUPT"` is sent via SignalR to `GameHub.TelemetryEvent`. These events are persisted individually to CSV, but there is no aggregate count per block.

## Requirements

1. **Increment counter on INTERRUPT** — In the existing `GameHub.TelemetryEvent` handler, when `data.Action == TelemetryAction.Interrupt`, increment a counter stored in `GameState`.

2. **Store counter in GameState** — Add an integer interrupt counter to `GameState` (thread-safe via the existing `lock` pattern). Provide methods to increment and read/reset it.

3. **Emit summary telemetry on BlockFinished** — In `GameHub.BlockFinished`, before resetting state, save a telemetry event with:
   - `Action`: `TelemetryAction.BlockInterrupts`
   - `Text`: the interrupt count (as string)
   - Then reset the counter to 0 for the next block.

4. **Add telemetry action constant** — Add `BlockInterrupts = "BLOCK_INTERRUPTS"` to `TelemetryAction` constants.

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/GameServer.Domain/Entities/GameState.cs` | Add `_interruptCount` field, `IncrementInterruptCount()`, `GetAndResetInterruptCount()` methods |
| `backend/src/GameServer.Domain/Constants/TelemetryAction.cs` | Add `BlockInterrupts` constant |
| `backend/src/GameServer.Api/Hubs/GameHub.cs` | In `TelemetryEvent`: compare with `TelemetryAction.Interrupt` and increment counter. In `BlockFinished`: save summary telemetry event and reset counter |

## Out of Scope

- Frontend changes (the frontend already sends INTERRUPT events correctly)
- Changes to the CSV format or telemetry DTO
- Displaying the counter in the UI (future work)
