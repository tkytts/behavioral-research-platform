# VBGameLab

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21613695.svg)](https://doi.org/10.5281/zenodo.21613695)

A controlled chat-based cooperative game platform for verbal behavior research. Built with React and .NET 8.

## Statement of Need

Oda et al. (2022) described their study as a proof-of-concept that can encourage the use of an online chat analog methodology to study complex social behavior, yet the online chat analog developed for that study was no longer available, its source code had not been published, and no documentation existed to support its development beyond the functionalities described and the screenshot presented in their article published in the Journal of the Experimental Analysis of Behavior, the only available publication on the work. VBGameLab was built from the ground up by Galhardi and de Barros (2025) to make that methodology available, for Galhardi's master's dissertation in experimental behavior analysis, which investigates the effect of the audience's perceived gender on the speaker's verbal behavior with Brazilian Portuguese-speaking participants through a replication of that study. The platform incorporates methodological modifications relative to the original study and additional features implemented throughout data collection:

- A tutorial based on the four components of Behavioral Skills Training (BST; Parsons et al., 2012): instruction, modeling, rehearsal, and feedback
- Interface available in Brazilian Portuguese and American English, with a language selector that allows researchers to add support for additional languages
- Adjustable font size for accessibility
- 10 players with Brazilian Portuguese names commonly perceived as gendered: five female and five male
- Cooperative problem-solving games in which participants and confederates collaborate to solve pattern completion logic puzzles involving different sequences of shapes, numbers, letters, and colors
- 10 five-trial blocks, with a different player per block, five perceived as female and five perceived as male, each trial lasting 75 seconds
- Five predetermined stimuli per trial: agreement with points (AP), agreement with no points (ANP), disagreement with points (DP), disagreement with no points (DNP), or no answer on time (TNP)
  - AP and DP award 7 points
  - TNP is also applied automatically if the experimenter/confederate does not submit the team's final answer within the time limit
- Audible notifications for incoming and outgoing messages
- A salient countdown timer functioning as a reflexive conditioned motivating operation (CMO-R): during the final ten seconds of each trial, the timer changes color from black to blinking red, accompanied by intermittent tick-tock sounds and an end-of-time alarm
- Automatic recording of interrupting responses, defined as any instance in which the participant sent a character, word, or phrase while the confederate was typing
- Keystroke-level telemetry logging all participant chat interactions, including keystrokes, sent and self-edited messages (defined as any instance in which the participant moved the cursor or used the keyboard to insert, modify, or delete previously typed characters, words, or phrases), mouse coordinates, and timestamps, as well as experimenter/confederate actions such as player messages and the stimulus applied in each trial, exported automatically as a spreadsheet at the end of each session
- An expanded experimenter/confederate interface displaying:
  - The programmed stimulus for each trial
  - Confederate suggestions about the solution to the problem presented in each trial
  - A dropdown menu with the verbal instances from the script assigned to the block's player
  - Automatic typing of the script's selected verbal instance at a speed calibrated to the experimenter/confederate's mean typing rate (words per minute)
  - A notes field displaying stimuli applied in each trial and for the experimenter/confederate's annotations throughout the session
- Trial duration, points per round, participant and player names, typing speed, audio cues, and interface features (dashboard, scripts modal, and notes field) are configurable via the game configuration modal and appsettings.json (see [Backend README](./backend/README.md)). Interface language is configurable via frontend localization files, and visual theme (colors and spacing) via the theme style file (see [Frontend README](./frontend/README.md)).

## Screenshots

### Experimenter View
![Experimenter interface](docs/screenshots/experimenter.png)
*The experimenter controls game flow, manages chat interactions, and monitors the session in real-time.*

### Participant View
![Participant interface](docs/screenshots/participant.png)
*Participants solve problems collaboratively while chatting with a partner in real-time.*

### Game Configuration
![Game configuration modal](docs/screenshots/start-game-modal.png)
*Experimenters configure session parameters: participant names, points per round, time limits, and audio cues.*

### Resolution Controls
![Resolve game modal](docs/screenshots/resolve-game-modal.png)
*After each problem, the experimenter records the outcome (Correct, Incorrect, Timeout, etc.) for research analysis.*

## Project Structure

```
├── frontend/          # React application
├── backend/           # .NET 8 API with SignalR
├── CONTRIBUTING.md    # Contribution guidelines
└── README.md          # This file
```

## Quick Start

### Prerequisites

- [Node.js 18+](https://nodejs.org/) and npm
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

### One-Command Start

**Windows:**
```bash
start-dev.bat        # Full setup (runs npm install)
start-dev-fast.bat   # Fast mode (skips npm install)
```

**Linux (tmux):**
```bash
./start-dev.sh        # Full setup (runs npm install)
./start-dev-fast.sh   # Fast mode (skips npm install)
./start-docker.sh     # Docker-based setup
```

### Manual Setup

#### Run Backend

```bash
cd backend
dotnet restore
dotnet run --project src/GameServer.Api
```

Backend runs at `http://localhost:5000`

#### Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`

## Documentation

| Document | Description |
|----------|-------------|
| [Frontend README](./frontend/README.md) | React app setup, routes, and testing |
| [Backend README](./backend/README.md) | API endpoints, SignalR events, configuration |
| [Contributing Guidelines](./CONTRIBUTING.md) | Coding standards and PR process |
| [E2E Testing Guide](./frontend/E2E-TESTING.md) | Playwright end-to-end tests |
| [Minimal Theme Guide](./frontend/MINIMAL-THEME-GUIDE.md) | UI theme customization |

## Features

- **Real-time Communication** - SignalR for instant messaging and game state updates
- **Multi-language Support** - English and Portuguese via i18next
- **Role-based Views** - Separate interfaces for participants and experimenters
- **Game State Management** - Timer, scoring, and problem navigation
- **Research Telemetry** - CSV logging for data collection
- **Configurable Audio Cues** - Chimes for messages, timer events
- **E2E Testing** - Playwright tests for complete workflows

## Architecture

This platform is designed for **controlled research sessions** with exactly two connected users: one experimenter and one participant. This is intentional; behavioral research requires isolated, reproducible conditions where the experimenter has full control over the session environment.

The architecture reflects this constraint:

- **Singleton GameState** - A single shared game state ensures both users see identical, synchronized data
- **Centralized Timer** - Server-authoritative countdown prevents client-side manipulation
- **Real-time Event Bus** - SignalR broadcasts state changes to all connected clients immediately
- **Telemetry Pipeline** - Every interaction is logged to CSV for post-session analysis

```
┌─────────────────┐         SignalR          ┌─────────────────┐
│  Experimenter   │◄──────────────────────►  │   .NET 8 API    │
│   (React)       │                          │                 │
└─────────────────┘                          │  ┌───────────┐  │
                                             │  │ GameState │  │
┌─────────────────┐         SignalR          │  │(Singleton)│  │
│  Participant    │◄──────────────────────►  │  └───────────┘  │
│   (React)       │                          │                 │
└─────────────────┘                          └────────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │  CSV Telemetry  │
                                             └─────────────────┘
```

For multi-session support, the architecture could be extended with session IDs and scoped state management, but the current design prioritizes simplicity and research validity over scalability.

## Security Considerations

> **⚠️ Important:** This application was not designed with security as a priority. It is intended for controlled research environments, not production deployment.

### Intended Use

This platform is designed to be:
- **Deployed on-demand** — only running during active data collection sessions
- **Hosted on a local network** — ideally accessible only to devices on the same LAN as the server

### Known Limitations

- No authentication or authorization mechanisms
- No input sanitization beyond basic framework defaults
- No rate limiting or abuse prevention
- No encryption of research data at rest

### Deployment Notes

University and institutional networks often have firewall restrictions that prevent local hosting. One workaround is using a reverse proxy service like [ngrok](https://ngrok.com/) to tunnel traffic to a home machine. This introduces additional risk since the application becomes publicly accessible, but may be acceptable for short data collection sessions (a few hours) where:

- The session URL is shared only with known participants
- The server is shut down immediately after the session
- No sensitive data beyond research responses is collected

**If you require a secure deployment**, consider adding authentication, HTTPS enforcement, and proper input validation before exposing this application to any untrusted network.

## Configuration

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_HUB_URL=http://localhost:5000/api/gamehub
```

### Backend Configuration

Edit `backend/src/GameServer.Api/appsettings.json`:

```json
{
  "Game": {
    "MaxTime": 120,
    "PointsAwarded": 7,
    "LogPath": "logs"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:3000"]
  },
  "Features": {
    "Dashboard": { "Active": true },
    "ScriptsModal": { "Active": true, "TypingWpm": 60 },
    "Notes": { "Active": true }
  }
}
```

## Testing

### Frontend Tests

```bash
cd frontend
npm test              # Watch mode
npm run test:ci       # Single run
npm run test:coverage # With coverage
```

### Backend Tests

```bash
cd backend
dotnet test
```

## Tech Stack

### Frontend
- React 18, React Router 6
- SignalR Client
- i18next
- Bootstrap 5
- Jest + React Testing Library

### Backend
- .NET 8, ASP.NET Core
- SignalR
- Clean Architecture
- xUnit, FluentAssertions, NSubstitute

## Acknowledgments

The authors thank Fernanda S. Oda for sharing the data collection protocol materials from the original study, including the tutorial, the problem-solving games, and the scripts developed from normative data on how North American adults interact using the software. These materials served as the reference for the development of the Brazilian Portuguese scripts, which were collected from normative data on how Brazilian speaker adults interact using the software, collected during Galhardi's pilot study conducted between September and October 2025 with five Brazilian adults at a private higher education institution in the state of São Paulo, Brazil.

## Citation

If you use VBGameLab in your research, please cite the software as follows:

Galhardi, A. L., & de Barros, E. G. (2025). VBGameLab: A controlled chat-based cooperative game platform for verbal behavior research (Version 1.0.0) [Computer software]. Zenodo. https://doi.org/10.5281/zenodo.21613695

> *Note:* The DOI above always resolves to the latest version. To cite the exact version you used, pick its version-specific DOI from the [Zenodo record](https://doi.org/10.5281/zenodo.21613695).

## Authors

*Ágatha Lara Galhardi*  
Programa de Pós-Graduação em Psicologia Experimental: Análise do Comportamento, Pontifícia Universidade Católica de São Paulo (PUC-SP)  
ORCID: [0000-0002-2742-7253](https://orcid.org/0000-0002-2742-7253)  
Lattes: https://lattes.cnpq.br/1204048511136727

*Eurico Garcia de Barros*  
Software architecture and development.

For authorship and contribution details, see [AUTHORSHIP.md](./AUTHORSHIP.md).

## Related Work

VBGameLab was developed to support the following dissertation study (in progress):

Galhardi, A. L. (in progress). O efeito do gênero percebido da audiência sobre o comportamento verbal do falante em um análogo experimental de bate-papo online [Master's thesis in progress, Pontifícia Universidade Católica de São Paulo].

The experimental paradigm that inspired that study was originally introduced by:

Oda, F. S., Lechago, S. A., Silva, B. E., & Hunt, J. C. (2022). An experimental analysis of gender-biased verbal behavior and self-editing using an online chat analog. Journal of the Experimental Analysis of Behavior, 118(1), 24–45. https://doi.org/10.1002/jeab.763

## References

Parsons, M. B., Rollyson, J. H., & Reid, D. H. (2012). Evidence-based staff training: A guide for practitioners. Behavior Analysis in Practice, 5(2), 2–11. https://doi.org/10.1007/BF03391819

## License

VBGameLab is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.html).

Under this license, any modified version of VBGameLab that is made available over a network must also be released under the AGPL-3.0, with its complete source code provided to users. See the [LICENSE](./LICENSE) file for the full license text.
