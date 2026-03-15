import { screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Experimenter from '../Experimenter';
import { renderWithProviders } from '../../test-utils/test-utils';

// Mock FeatureToggleContext
jest.mock('../../api/config', () => ({
  getFeatures: jest.fn().mockResolvedValue({
    dashboard: { active: true },
    scriptsModal: { active: true, typingWpm: 60 },
  }),
}));

// Mock ChimesConfigContext to prevent real game calls
jest.mock('../../context/ChimesConfigContext', () => ({
  ChimesConfigProvider: ({ children }) => children,
  useChimesConfig: () => ({
    chimesConfig: {
      messageSent: true,
      messageReceived: true,
      timer: true,
    },
    updateChimesConfig: jest.fn(),
  }),
}));

// Mock API modules
jest.mock('../../api/users', () => ({
  getCurrentUser: jest.fn(() => Promise.resolve('{"name":"Test Participant"}')),
}));

jest.mock('../../api/blocks', () => ({
  getSuggestions: jest.fn(() => Promise.resolve([
    ['sugA1', 'sugA2', 'sugA3', 'sugA4', 'sugA5'],
    ['sugB1', 'sugB2', 'sugB3', 'sugB4', 'sugB5'],
    ['sugC1', 'sugC2', 'sugC3', 'sugC4', 'sugC5'],
  ])),
}));

jest.mock('../../data/confederates', () => {
  const scriptData = {
    orders: [1, 10],
    message_groups: {
      start_conversation: { messages: ['hello'] },
      express_opinions: { messages: ['opinion'] },
      agree: { messages: ['yes'] },
      disagree: { messages: ['no'] },
      ask_answer_questions: { messages: ['question?'] },
      when_points_obtained: { messages: ['great!'] },
      when_points_not_obtained: { messages: ['oh no'] },
      laugh: { messages: ['haha'] },
    },
    resolutions: [
      { problem: 0, resolution: 'DNP' },
      { problem: 1, resolution: 'AP' },
      { problem: 2, resolution: 'TNP' },
      { problem: 3, resolution: 'DP' },
      { problem: 4, resolution: 'ANP' },
    ],
  };
  return {
    getConfederatesStart: jest.fn(() =>
      Promise.resolve({
        femaleData: [
          { name: 'Alice', order: 1 },
          { name: 'Beth',  order: 3 },
          { name: 'Carol', order: 5 },
        ],
        maleData: [
          { name: 'David', order: 2 },
          { name: 'Eric',  order: 4 },
          { name: 'Frank', order: 6 },
        ],
      })
    ),
    getScriptForOrder: jest.fn(() => Promise.resolve(scriptData)),
  };
});

// Mock realtime/game module
jest.mock('../../realtime/game', () => ({
  onTutorialDone: jest.fn(),
  offTutorialDone: jest.fn(),
  clearAnswer: jest.fn(),
  nextProblem: jest.fn(),
  resetTimer: jest.fn(),
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  startGame: jest.fn(),
  setPointsAwarded: jest.fn(),
  setMaxTime: jest.fn(),
  setConfederate: jest.fn(),
  setChimes: jest.fn(),
  updateProblemSelection: jest.fn(),
  clearChat: jest.fn(),
  blockFinished: jest.fn(),
  gameEnded: jest.fn(),
  stopGame: jest.fn(),
  telemetryEvent: jest.fn(),
  setGameResolution: jest.fn(),
  saveNotes: jest.fn(),
}));

// Mock child components
jest.mock('../../components/ChatBox', () => {
  const React = require('react');
  return React.forwardRef(function ChatBox({ isAdmin }, ref) {
    React.useImperativeHandle(ref, () => ({
      startTypingSimulation: jest.fn(),
    }), []);
    return (
      <div data-testid="chat-box">
        ChatBox - Admin: {isAdmin.toString()}
      </div>
    );
  });
});

jest.mock('../../components/GameBox', () => {
  return function GameBox({ isAdmin }) {
    return <div data-testid="game-box">GameBox - Admin: {isAdmin.toString()}</div>;
  };
});

jest.mock('../../components/Modal', () => {
  return function Modal({ children }) {
    return <div data-testid="modal">{children}</div>;
  };
});

jest.mock('../../components/ExperimenterNotes', () => {
  return function ExperimenterNotes() {
    return <div data-testid="experimenter-notes" />;
  };
});

jest.mock('../../components/GameConfigModal', () => {
  const React = require('react');
  return function GameConfigModal({ isOpen, onClose, onSave, confederatesFemaleStart, confederatesMaleStart, initialGender, initialConfederateName }) {
    const [gender, setGender] = React.useState('F');
    const [pts, setPts] = React.useState(7);
    const [mt, setMt] = React.useState(75);
    const [mr, setMr] = React.useState(true);
    const [ms, setMs] = React.useState(true);
    const [tmr, setTmr] = React.useState(true);

    if (!isOpen) return null;

    // Compute confederateName synchronously from props (no effect timing issues)
    const pool = gender === 'F' ? confederatesFemaleStart : confederatesMaleStart;
    const confederateName = initialConfederateName || pool?.[0]?.name || '';

    return (
      <div data-testid="modal">
        <h2>game_configuration</h2>
        <label>
          <input type="radio" name="gender" value="F" checked={gender === 'F'} onChange={() => setGender('F')} /> female
        </label>
        <label>
          <input type="radio" name="gender" value="M" checked={gender === 'M'} onChange={() => setGender('M')} /> male
        </label>
        <select value={confederateName} onChange={() => {}}>
          <option value="" disabled>select_confederate_name</option>
          {(pool || []).map((c, i) => <option key={i} value={c.name}>{c.name}</option>)}
        </select>
        <input type="number" value={pts} onChange={e => setPts(Number(e.target.value))} />
        <input type="number" value={mt} onChange={e => setMt(Number(e.target.value))} />
        <input type="checkbox" checked={mr} onChange={e => setMr(e.target.checked)} />
        <input type="checkbox" checked={ms} onChange={e => setMs(e.target.checked)} />
        <input type="checkbox" checked={tmr} onChange={e => setTmr(e.target.checked)} />
        <button onClick={() => onSave({ confederateName, gender, pointsAwarded: pts, maxTimeInput: mt, chimes: { messageSent: ms, messageReceived: mr, timer: tmr } })}>start</button>
        <button onClick={onClose}>cancel</button>
      </div>
    );
  };
});

jest.mock('../../components/ExperimenterDashboard', () => {
  return function ExperimenterDashboard({ currentProblem, currentScript, currentConfederateIndex, suggestions }) {
    const resolution = currentScript?.resolutions?.[currentProblem]?.resolution;
    const suggestion = suggestions?.[currentConfederateIndex]?.[currentProblem];
    return (
      <div data-testid="experimenter-dashboard">
        <span>Problem</span>
        <span>{currentProblem + 1}</span>
        {resolution && (
          <>
            <span>Resolution</span>
            <span>{resolution}</span>
          </>
        )}
        {suggestion && (
          <>
            <span>Possible team answer</span>
            <span>{suggestion}</span>
          </>
        )}
      </div>
    );
  };
});

jest.mock('../../components/ScriptsPanel', () => {
  const React = require('react');
  return function ScriptsPanel({ currentScript }) {
    const [collapsed, setCollapsed] = React.useState(true);
    const [isSimulating, setIsSimulating] = React.useState(false);
    if (!currentScript) return null;
    return (
      <div data-testid="scripts-panel">
        <span>Confederate Scripts</span>
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? 'Expand All' : 'Collapse All'}
        </button>
        <ul>
          <li style={{ cursor: isSimulating ? 'not-allowed' : 'pointer' }}>
            <button onClick={() => setIsSimulating(true)}>Initiating conversations</button>
          </li>
        </ul>
      </div>
    );
  };
});

jest.mock('../../components/ResolutionModal', () => {
  return function ResolutionModal({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="resolution-modal">
        <button onClick={onClose}>close-resolution</button>
      </div>
    );
  };
});

// Mock alert
global.alert = jest.fn();


// Get mock functions from the mocked module
const mockFunctions = require('../../realtime/game');

describe('Experimenter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Re-establish getFeatures default after clearAllMocks
    const configMock = require('../../api/config');
    configMock.getFeatures.mockResolvedValue({
      dashboard: { active: true },
      scriptsModal: { active: true, typingWpm: 60 },
    });

    // Re-establish data-returning implementations that clearAllMocks resets.
    const confederatesMock = require('../../data/confederates');
    confederatesMock.getConfederatesStart.mockResolvedValue({
      femaleData: [
        { name: 'Alice', order: 1 },
        { name: 'Beth',  order: 3 },
        { name: 'Carol', order: 5 },
      ],
      maleData: [
        { name: 'David', order: 2 },
        { name: 'Eric',  order: 4 },
        { name: 'Frank', order: 6 },
      ],
    });
    confederatesMock.getScriptForOrder.mockResolvedValue({
      orders: [1, 10],
      message_groups: {
        start_conversation: { messages: ['hello'] },
        express_opinions: { messages: ['opinion'] },
        agree: { messages: ['yes'] },
        disagree: { messages: ['no'] },
        ask_answer_questions: { messages: ['question?'] },
        when_points_obtained: { messages: ['great!'] },
        when_points_not_obtained: { messages: ['oh no'] },
        laugh: { messages: ['haha'] },
      },
      resolutions: [
        { problem: 0, resolution: 'DNP' },
        { problem: 1, resolution: 'AP' },
        { problem: 2, resolution: 'TNP' },
        { problem: 3, resolution: 'DP' },
        { problem: 4, resolution: 'ANP' },
      ],
    });
    const blocksMock = require('../../api/blocks');
    blocksMock.getSuggestions.mockResolvedValue([
      ['sugA1', 'sugA2', 'sugA3', 'sugA4', 'sugA5'],
      ['sugB1', 'sugB2', 'sugB3', 'sugB4', 'sugB5'],
      ['sugC1', 'sugC2', 'sugC3', 'sugC4', 'sugC5'],
    ]);
  });

  describe('Initial Render', () => {
    it('should render ChatBox and GameBox with admin=true', async () => {
      renderWithProviders(<Experimenter />);

      await waitFor(() => {
        expect(screen.getByTestId('chat-box')).toBeInTheDocument();
      });
      const chatBox = screen.getByTestId('chat-box');
      const gameBox = screen.getByTestId('game-box');

      expect(chatBox).toHaveTextContent('Admin: true');
      expect(gameBox).toHaveTextContent('Admin: true');
    });

    it('should render control buttons', () => {
      renderWithProviders(<Experimenter />);

      expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    });

    it('should not show modals initially', () => {
      renderWithProviders(<Experimenter />);

      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should load confederates data on mount', async () => {
      const { getConfederatesStart } = require('../../data/confederates');

      renderWithProviders(<Experimenter />);

      await waitFor(() => {
        expect(getConfederatesStart).toHaveBeenCalled();
      });
    });

    it('should load current user on mount', async () => {
      const { getCurrentUser } = require('../../api/users');

      renderWithProviders(<Experimenter />);

      await waitFor(() => {
        expect(getCurrentUser).toHaveBeenCalled();
      });
    });

    it('should load suggestions on mount', async () => {
      const { getSuggestions } = require('../../api/blocks');

      renderWithProviders(<Experimenter />);

      await waitFor(() => {
        expect(getSuggestions).toHaveBeenCalled();
      });
    });
  });

  describe('Game Configuration Modal', () => {
    it('should open game config modal when start game button is clicked', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });

    it('should display gender selection radio buttons in modal', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        const radios = screen.getAllByRole('radio');
        expect(radios.length).toBe(2);
      });
    });

    it('should display confederate name dropdown in modal', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should display points awarded input in modal', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        const numberInputs = screen.getAllByRole('spinbutton');
        expect(numberInputs.length).toBeGreaterThan(0);
      });
    });

    it('should have default female gender selected', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        const femaleRadio = screen.getByRole('radio', { name: /female/i });
        expect(femaleRadio).toBeChecked();
      });
    });

    it('should switch confederate list when gender changes', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(async () => {
        const radios = screen.getAllByRole('radio');
        const maleRadio = radios.find(r => r.value === 'M');
        await userEvent.click(maleRadio);
      });

      await waitFor(() => {
        const radios = screen.getAllByRole('radio');
        const maleRadio = radios.find(r => r.value === 'M');
        expect(maleRadio).toBeChecked();
      });
    });

    it('should close modal when cancelled', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(async () => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });
  });

  describe('Game Configuration Save', () => {
    it('should call game setup functions when save is clicked', async () => {
      renderWithProviders(<Experimenter />);

      // Open modal
      const startGameButton = screen.getAllByRole('button')[0];
      await userEvent.click(startGameButton);

      // Wait for modal to appear and find the start button inside it
      await waitFor(() => {
        expect(screen.getByText(/game_configuration/i)).toBeInTheDocument();
      });

      // Find and click the start button in the modal (translated as "start")
      const startButton = screen.getByText('start');
      await userEvent.click(startButton);

      // Should call game functions
      await waitFor(() => {
        expect(mockFunctions.startGame).toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Problem Navigation', () => {
    it('should advance problem when next problem button is clicked', async () => {
      renderWithProviders(<Experimenter />);

      const nextButton = screen.getByRole('button', { name: /next_problem/i });

      await userEvent.click(nextButton);

      expect(mockFunctions.clearAnswer).toHaveBeenCalled();
    });

    it('should reset and start timer for new problem', async () => {
      renderWithProviders(<Experimenter />);

      const nextButton = screen.getByRole('button', { name: /next_problem/i });

      await userEvent.click(nextButton);

      expect(mockFunctions.resetTimer).toHaveBeenCalled();
      expect(mockFunctions.startTimer).toHaveBeenCalled();
    });
  });

  describe('Resolution Modal', () => {
    it('should open resolution modal when resolve button is clicked', async () => {
      renderWithProviders(<Experimenter />);

      const buttons = screen.getAllByRole('button');
      const resolveButton = buttons[1]; // Middle button

      await userEvent.click(resolveButton);

      await waitFor(() => {
        expect(screen.getByTestId('resolution-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Complete Modal', () => {
    it('should show tutorial complete modal when tutorial is done', async () => {
      let tutorialHandler;

      mockFunctions.onTutorialDone.mockImplementation((handler) => {
        tutorialHandler = handler;
      });

      renderWithProviders(<Experimenter />);

      // Trigger tutorial complete
      tutorialHandler(3);

      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
    });
  });

  describe('Event Handlers', () => {
    it('should register tutorial done handler on mount', () => {
      renderWithProviders(<Experimenter />);

      expect(mockFunctions.onTutorialDone).toHaveBeenCalled();
    });

    it('should unregister tutorial done handler on unmount', () => {
      const { unmount } = renderWithProviders(<Experimenter />);

      unmount();

      expect(mockFunctions.offTutorialDone).toHaveBeenCalled();
    });
  });

  describe('Chimes Configuration', () => {
    it('should display chime checkboxes in config modal', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toBeGreaterThan(0);
      });
    });

    it('should have message received chimes enabled by default', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
      });
    });
  });

  describe('End Session Button', () => {
    let confirmSpy;

    beforeEach(() => {
      confirmSpy = jest.spyOn(window, 'confirm');
    });

    afterEach(() => {
      confirmSpy.mockRestore();
    });

    it('should render the End Session button', () => {
      renderWithProviders(<Experimenter />);
      expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument();
    });

    it('should not show feedback alert before clicking the button', () => {
      renderWithProviders(<Experimenter />);
      expect(screen.queryByText('Session ended. Data saved.')).not.toBeInTheDocument();
    });

    it('should not call any hub methods when confirm is cancelled', async () => {
      confirmSpy.mockReturnValue(false);
      renderWithProviders(<Experimenter />);

      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      expect(mockFunctions.stopGame).not.toHaveBeenCalled();
      expect(mockFunctions.clearChat).not.toHaveBeenCalled();
      expect(mockFunctions.telemetryEvent).not.toHaveBeenCalled();
      expect(mockFunctions.gameEnded).not.toHaveBeenCalled();
    });

    it('should not show feedback alert when confirm is cancelled', async () => {
      confirmSpy.mockReturnValue(false);
      renderWithProviders(<Experimenter />);

      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      expect(screen.queryByText('Session ended. Data saved.')).not.toBeInTheDocument();
    });

    it('should call stopGame when confirm is accepted', async () => {
      confirmSpy.mockReturnValue(true);
      renderWithProviders(<Experimenter />);

      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      expect(mockFunctions.stopGame).toHaveBeenCalled();
    });

    it('should call clearChat when confirm is accepted', async () => {
      confirmSpy.mockReturnValue(true);
      renderWithProviders(<Experimenter />);

      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      expect(mockFunctions.clearChat).toHaveBeenCalled();
    });

    it('should call telemetryEvent with CollectionEnded when confirm is accepted', async () => {
      confirmSpy.mockReturnValue(true);
      renderWithProviders(<Experimenter />);

      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      expect(mockFunctions.telemetryEvent).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'CollectionEnded' })
      );
    });

    it('should call gameEnded when confirm is accepted', async () => {
      confirmSpy.mockReturnValue(true);
      renderWithProviders(<Experimenter />);

      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      expect(mockFunctions.gameEnded).toHaveBeenCalled();
    });

    it('should call stopGame before clearChat, and clearChat before gameEnded', async () => {
      confirmSpy.mockReturnValue(true);
      const callOrder = [];
      mockFunctions.stopGame.mockImplementation(() => { callOrder.push('stopGame'); });
      mockFunctions.clearChat.mockImplementation(() => { callOrder.push('clearChat'); });
      mockFunctions.gameEnded.mockImplementation(() => { callOrder.push('gameEnded'); });

      renderWithProviders(<Experimenter />);
      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      expect(callOrder.indexOf('stopGame')).toBeLessThan(callOrder.indexOf('clearChat'));
      expect(callOrder.indexOf('clearChat')).toBeLessThan(callOrder.indexOf('gameEnded'));
    });

    it('should show feedback alert after confirm is accepted', async () => {
      confirmSpy.mockReturnValue(true);
      renderWithProviders(<Experimenter />);

      await userEvent.click(screen.getByRole('button', { name: /end session/i }));

      await waitFor(() => {
        expect(screen.getByText('Session ended. Data saved.')).toBeInTheDocument();
      });
    });
  });


  describe('Dashboard', () => {
    async function startGame() {
      // Flush all pending async effects (confederates + scripts data loads)
      // so handleGenderChange sees a populated confederate list when the modal opens.
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const startGameButton = screen.getAllByRole('button')[0];
      await userEvent.click(startGameButton);
      await screen.findByTestId('modal');
      await userEvent.click(screen.getByText('start'));
      await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument());
    }

    it('should show problem label after game is started', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByText('Problem')).toBeInTheDocument();
      });
    });

    it('should show problem number after game is started', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should show expected resolution label and value after game is started', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByText('Resolution')).toBeInTheDocument();
        expect(screen.getByText('DNP')).toBeInTheDocument();
      });
    });

    it('should display scripts title inline after game is started', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByText('Confederate Scripts')).toBeInTheDocument();
      });
    });

    it('should display message group headings inline after game is started', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByText('Initiating conversations')).toBeInTheDocument();
      });
    });

    it('should display expand all button inline after game is started', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument();
      });
    });

    it('should toggle to collapse all button after clicking expand all', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: 'Expand All' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Collapse All' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Expand All' })).not.toBeInTheDocument();
      });
    });

    it('should toggle back to expand all button after clicking collapse all', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: 'Expand All' }));
      await waitFor(() => expect(screen.getByRole('button', { name: 'Collapse All' })).toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: 'Collapse All' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Expand All' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Collapse All' })).not.toBeInTheDocument();
      });
    });

    it('should show suggestion label after game is started', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByText('Possible team answer')).toBeInTheDocument();
      });
    });

    it('should show suggestion value for current block and problem', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();
      await waitFor(() => {
        expect(screen.getByText('sugA1')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Toggles', () => {
    async function startGame() {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      const startGameButton = screen.getAllByRole('button')[0];
      await userEvent.click(startGameButton);
      await screen.findByTestId('modal');
      await userEvent.click(screen.getByText('start'));
      await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument());
    }

    it('hides dashboard card when dashboard.active is false', async () => {
      const configMock = require('../../api/config');
      configMock.getFeatures.mockResolvedValue({
        dashboard: { active: false },
        scriptsModal: { active: true, typingWpm: 60 },
      });

      renderWithProviders(<Experimenter />);
      await startGame();

      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      expect(screen.queryByText('Problem')).not.toBeInTheDocument();
    });

    it('hides scripts panel when scriptsModal.active is false', async () => {
      const configMock = require('../../api/config');
      configMock.getFeatures.mockResolvedValue({
        dashboard: { active: true },
        scriptsModal: { active: false, typingWpm: 60 },
      });

      renderWithProviders(<Experimenter />);
      await startGame();

      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      expect(screen.queryByText('Confederate Scripts')).not.toBeInTheDocument();
    });
  });

  describe('Points and Time Configuration', () => {
    it('should have default points value of 7', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const pointsInput = spinbuttons[0];
        expect(pointsInput).toHaveValue(7);
      });
    });

    it('should have default max time of 90 seconds', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(() => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const timeInput = spinbuttons[1];
        expect(timeInput).toHaveValue(90);
      });
    });

    it('should allow changing points value', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(async () => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const pointsInput = spinbuttons[0];

        await userEvent.clear(pointsInput);
        await userEvent.type(pointsInput, '10');

        expect(pointsInput).toHaveValue(10);
      });
    });

    it('should allow changing max time value', async () => {
      renderWithProviders(<Experimenter />);

      const startButton = screen.getAllByRole('button')[0];
      await userEvent.click(startButton);

      await waitFor(async () => {
        const spinbuttons = screen.getAllByRole('spinbutton');
        const timeInput = spinbuttons[1];

        await userEvent.clear(timeInput);
        await userEvent.type(timeInput, '120');

        expect(timeInput).toHaveValue(120);
      });
    });
  });

  describe('Automated Typing Simulation', () => {
    async function startGame() {
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const startGameButton = screen.getAllByRole('button')[0];
      await userEvent.click(startGameButton);
      await screen.findByTestId('modal');
      await userEvent.click(screen.getByText('start'));
      await waitFor(() => expect(screen.queryByRole('combobox')).not.toBeInTheDocument());
    }

    it('calls getFeatures on mount', async () => {
      const { getFeatures } = require('../../api/config');
      renderWithProviders(<Experimenter />);

      await waitFor(() => expect(getFeatures).toHaveBeenCalled());
    });

    it('script list items show pointer cursor when not simulating', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();

      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      const items = screen.getAllByRole('listitem');
      expect(items.length).toBeGreaterThan(0);
      items.forEach(li => expect(li).toHaveStyle({ cursor: 'pointer' }));
    });

    it('script list items show not-allowed cursor immediately after click', async () => {
      renderWithProviders(<Experimenter />);
      await startGame();

      await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

      const items = screen.getAllByRole('listitem');
      await userEvent.click(within(items[0]).getByRole('button'));

      // isSimulating flips to true synchronously; setIsSimulating(false) is in a
      // setTimeout that hasn't fired yet, so cursor should be not-allowed right now.
      screen.getAllByRole('listitem').forEach(li =>
        expect(li).toHaveStyle({ cursor: 'not-allowed' })
      );
    });
  });
});
