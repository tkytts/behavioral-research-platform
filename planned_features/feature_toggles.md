# Feature Toggles for Dashboard and Scripts Modal

## Overview

Add a backend-driven feature toggle system so the experimenter dashboard and scripts modal can be turned on/off via `appsettings.json`, served to the frontend through a REST endpoint and consumed via a unified React Context. Also migrate `typingWpm` from the static `config.json` into the scripts modal feature config.

## Background

The Experimenter page renders two helper panels when a confederate is selected: a **dashboard** (problem number, expected resolution, suggestion) and a **scripts modal** (pre-written dialog scripts with click-to-type). These are always visible today, but researchers may want to disable them for certain study conditions.

The config must come from the backend rather than the static `frontend/public/config.json` to prevent participants from discovering toggle states by inspecting network requests to the public folder. Since we're adding a backend config endpoint, `typingWpm` (currently in `config.json`) belongs under the scripts modal feature config, and the static file can be removed.

## Config Structure

### `appsettings.json`

```json
{
  "Features": {
    "Dashboard": {
      "Active": true
    },
    "ScriptsModal": {
      "Active": true,
      "TypingWpm": 60
    }
  }
}
```

Each feature is an object with an `Active` boolean and optional feature-specific config properties.

### C# Model

```csharp
public class FeatureSettings
{
    public const string SectionName = "Features";
    public DashboardFeature Dashboard { get; set; } = new();
    public ScriptsModalFeature ScriptsModal { get; set; } = new();
}

public class DashboardFeature
{
    public bool Active { get; set; } = true;
}

public class ScriptsModalFeature
{
    public bool Active { get; set; } = true;
    public int TypingWpm { get; set; } = 60;
}
```

### Frontend Hooks

```javascript
const showDashboard = useFeatureActive("dashboard");       // true/false
const showScripts = useFeatureActive("scriptsModal");      // true/false
const { typingWpm } = useFeatureConfig("scriptsModal");    // { active, typingWpm }
```

A single `FeatureToggleProvider` fetches `/api/config/features` once on mount and exposes both hooks from one context.

## Requirements

1. **Add FeatureSettings** — New `FeatureSettings.cs` in `GameServer.Application` with nested `DashboardFeature` and `ScriptsModalFeature` classes. All properties default to enabled/sensible values. Register via Options pattern in `Program.cs`.

2. **Add ConfigController** — New controller in `GameServer.Api` with `GET /api/config/features` that injects `IOptions<FeatureSettings>` and returns its value as camelCase JSON.

3. **Add frontend API module** — New `frontend/src/api/config.js` exporting `getFeatures()` that calls `client.get('/config/features')`.

4. **Create FeatureToggleContext** — New context + provider + hooks in `frontend/src/context/FeatureToggleContext.js`. Fetch features on mount, merge over defaults, expose `useFeatureActive(name)` and `useFeatureConfig(name)`.

5. **Wire provider into app** — Wrap the app tree with `FeatureToggleProvider` in `frontend/src/index.js`.

6. **Gate dashboard and scripts modal** — In `Experimenter.js`, use `useFeatureActive` to conditionally render the dashboard and scripts modal sections.

7. **Migrate typingWpm** — In `Experimenter.js`, replace the `fetch("/config.json")` call with `useFeatureConfig("scriptsModal")` to read `typingWpm`. Remove `frontend/public/config.json`.

8. **Update tests** — Add unit tests for the context/hooks. Update Experimenter tests and `test-utils.js` to include the provider. Add backend tests for the endpoint.

## Files to Modify

| File | Change |
|------|--------|
| `backend/src/GameServer.Api/appsettings.json` | Add `Features` section |
| `backend/src/GameServer.Application/FeatureSettings.cs` | **New file** — `FeatureSettings`, `DashboardFeature`, `ScriptsModalFeature` POCOs |
| `backend/src/GameServer.Api/Controllers/ConfigController.cs` | **New file** — `GET /api/config/features` endpoint |
| `backend/src/GameServer.Api/Program.cs` | Register `FeatureSettings` via Options pattern |
| `frontend/public/config.json` | **Delete** — replaced by backend endpoint |
| `frontend/src/api/config.js` | **New file** — `getFeatures()` API call |
| `frontend/src/context/FeatureToggleContext.js` | **New file** — context, provider, `useFeatureActive`, `useFeatureConfig` hooks |
| `frontend/src/index.js` | Wrap app with `FeatureToggleProvider` |
| `frontend/src/pages/Experimenter.js` | Import hooks, add toggle checks, replace `config.json` fetch with context |
| `frontend/src/context/__tests__/FeatureToggleContext.test.js` | **New file** — tests for defaults, explicit `false`, config values |
| `frontend/src/pages/__tests__/Experimenter.test.js` | Update mocks for new config source, test toggled-off state |
| `frontend/src/test-utils/test-utils.js` | Add `FeatureToggleProvider` to `renderWithProviders` |

## Out of Scope

- Per-user or per-session toggles
- Admin UI for editing toggles (edit `appsettings.json` directly)
- Toggling features beyond dashboard and scripts modal (add new feature classes later as needed)
