Tutorial currently triggers telemetryevents, these files are always discarded. We need to add a way to filter out tutorial telemetry data.

I was thinking of adding a bool isTutorial somewhere and have that checked before saving any telemetry data. This could complicate things if we ever move to support multiple experiments running on the same server, so I'm open to suggestions.

Don't assume anything, ask questions if you need information.