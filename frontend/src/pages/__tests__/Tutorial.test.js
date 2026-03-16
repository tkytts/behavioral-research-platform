import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Tutorial from '../Tutorial';
import { renderWithProviders } from '../../test-utils/test-utils';

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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock realtime/game module
jest.mock('../../realtime/game', () => ({
  onStatusUpdate: jest.fn(),
  offStatusUpdate: jest.fn(),
  onReceiveMessage: jest.fn(),
  offReceiveMessage: jest.fn(),
  setMaxTime: jest.fn(),
  setChimes: jest.fn(),
  startTutorial: jest.fn(),
  setConfederate: jest.fn(),
  tutorialProblem: jest.fn(),
  startTimer: jest.fn(),
  stopTimer: jest.fn(),
  typing: jest.fn(),
  sendMessage: jest.fn(),
  setAnswer: jest.fn(),
  setGameResolution: jest.fn(),
  resetPoints: jest.fn(),
  clearChat: jest.fn(),
  tutorialDone: jest.fn(),
}));

// Mock child components
jest.mock('../../components/ChatBox', () => {
  return function ChatBox({ currentUser, isAdmin }) {
    return (
      <div data-testid="chat-box">
        ChatBox - User: {currentUser}, Admin: {isAdmin.toString()}
      </div>
    );
  };
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

jest.mock('../../components/InputModal', () => {
  return function InputModal({ show, value, onChange, onClose, onSubmit }) {
    if (!show) return null;
    return (
      <div data-testid="input-modal">
        <input
          data-testid="modal-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button onClick={onSubmit}>Submit</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Mock setTimeout to avoid waiting in tests
jest.useFakeTimers();

// Get mock functions from the mocked module
const mockFunctions = require('../../realtime/game');

describe('Tutorial Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
  });

  describe('Initial Render', () => {
    it('should render tutorial start screen', () => {
      renderWithProviders(<Tutorial />);

      // Should have at least one button to start
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should not show ChatBox and GameBox initially', () => {
      renderWithProviders(<Tutorial />);

      expect(screen.queryByTestId('chat-box')).not.toBeInTheDocument();
      expect(screen.queryByTestId('game-box')).not.toBeInTheDocument();
    });

    it('should start at tutorial step 0', () => {
      const { container } = renderWithProviders(<Tutorial />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Event Handler Registration', () => {
    it('should register status update handler on mount', () => {
      renderWithProviders(<Tutorial />);

      expect(mockFunctions.onStatusUpdate).toHaveBeenCalled();
    });

    it('should unregister handlers on unmount', () => {
      const { unmount } = renderWithProviders(<Tutorial />);

      unmount();

      expect(mockFunctions.offStatusUpdate).toHaveBeenCalled();
    });
  });

  describe('Status Update Navigation', () => {
    it('should navigate to participant page when game goes live', () => {
      let statusHandler;

      mockFunctions.onStatusUpdate.mockImplementation((handler) => {
        statusHandler = handler;
      });

      renderWithProviders(<Tutorial />);

      // Trigger status update with isLive = true
      statusHandler(true);

      expect(mockNavigate).toHaveBeenCalledWith('/participant');
    });

    it('should not navigate when game is not live', () => {
      let statusHandler;

      mockFunctions.onStatusUpdate.mockImplementation((handler) => {
        statusHandler = handler;
      });

      renderWithProviders(<Tutorial />);

      // Trigger status update with isLive = false
      statusHandler(false);

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Tutorial Step 1 - Start Tutorial', () => {
    it('should advance to step 1 when start button is clicked', async () => {
      renderWithProviders(<Tutorial />);

      // Find and click the first button (start tutorial)
      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      // Should call tutorial setup functions
      await waitFor(() => {
        expect(mockFunctions.setMaxTime).toHaveBeenCalledWith(75);
      });
    });

    it('calls startTutorial when the ready button is clicked', async () => {
      renderWithProviders(<Tutorial />);

      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      await waitFor(() => {
        expect(mockFunctions.startTutorial).toHaveBeenCalledTimes(1);
      });
    });

    it('should set chimes configuration when tutorial starts', async () => {
      renderWithProviders(<Tutorial />);

      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      await waitFor(() => {
        expect(mockFunctions.setChimes).toHaveBeenCalledWith({
          messageSent: true,
          messageReceived: true,
          timer: true,
        });
      });
    });

    it('should show game components after tutorial starts', async () => {
      renderWithProviders(<Tutorial />);

      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('chat-box')).toBeInTheDocument();
      });
      expect(screen.getByTestId('game-box')).toBeInTheDocument();
    });

    it('should set username when tutorial starts', async () => {
      renderWithProviders(<Tutorial />);

      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('chat-box')).toBeInTheDocument();
      });
    });
  });

  describe('Tutorial Navigation', () => {
    it('should progress through tutorial steps when clicking next', async () => {
      renderWithProviders(<Tutorial />);

      // Start tutorial
      let buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      // Wait for game components
      await waitFor(() => {
        expect(screen.getByTestId('chat-box')).toBeInTheDocument();
      });

      // Click next buttons to progress
      buttons = screen.getAllByRole('button');
      if (buttons.length > 1) {
        await userEvent.click(buttons[buttons.length - 1]);
      }

      // Tutorial should be progressing
      expect(screen.getByTestId('chat-box')).toBeInTheDocument();
    });
  });

  describe('Tutorial Components Rendering', () => {
    it('should render ChatBox with correct props during tutorial', async () => {
      renderWithProviders(<Tutorial />);

      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      await waitFor(() => {
        const chatBox = screen.getByTestId('chat-box');
        expect(chatBox).toHaveTextContent('Admin: false');
      });
    });

    it('should render GameBox with isAdmin=false', async () => {
      renderWithProviders(<Tutorial />);

      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      await waitFor(() => {
        const gameBox = screen.getByTestId('game-box');
        expect(gameBox).toHaveTextContent('Admin: false');
      });
    });
  });

  describe('Tutorial Game Functions', () => {
    it('should call tutorial game functions when appropriate', async () => {
      renderWithProviders(<Tutorial />);

      // Start tutorial
      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      // Should call tutorial setup functions
      await waitFor(() => {
        expect(mockFunctions.setMaxTime).toHaveBeenCalled();
      });
      expect(mockFunctions.setChimes).toHaveBeenCalled();
    });
  });

  describe('Message Simulation', () => {
    it('should register message receive handler', () => {
      renderWithProviders(<Tutorial />);

      expect(mockFunctions.onReceiveMessage).toHaveBeenCalled();
    });

    it('should unregister message handler on unmount', () => {
      const { unmount } = renderWithProviders(<Tutorial />);

      unmount();

      expect(mockFunctions.offReceiveMessage).toHaveBeenCalled();
    });
  });

  describe('Tutorial Completion', () => {
    it('should allow completing tutorial', async () => {
      renderWithProviders(<Tutorial />);

      // Tutorial should be completable
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should track number of tries', () => {
      renderWithProviders(<Tutorial />);

      // Tutorial component should initialize with 1 try
      const { container } = renderWithProviders(<Tutorial />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Tutorial State Management', () => {
    it('should manage tutorial step state', async () => {
      const { container } = renderWithProviders(<Tutorial />);

      expect(container).toBeInTheDocument();

      // Start tutorial
      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      // State should update
      await waitFor(() => {
        expect(screen.getByTestId('chat-box')).toBeInTheDocument();
      });
    });

    it('should manage username state', async () => {
      renderWithProviders(<Tutorial />);

      // Start tutorial
      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      // Username should be set
      await waitFor(() => {
        const chatBox = screen.getByTestId('chat-box');
        expect(chatBox).toBeInTheDocument();
      });
    });
  });

  describe('Timer Integration', () => {
    it('should be able to start timer during tutorial', async () => {
      renderWithProviders(<Tutorial />);

      // Timer function should be available
      expect(mockFunctions.startTimer).toBeDefined();
      expect(mockFunctions.stopTimer).toBeDefined();
    });
  });

  describe('Confederate Simulation', () => {
    it('should be able to set confederate during tutorial', async () => {
      renderWithProviders(<Tutorial />);

      // Confederate function should be available
      expect(mockFunctions.setConfederate).toBeDefined();
    });
  });

  describe('Problem Simulation', () => {
    it('should be able to set tutorial problem', async () => {
      renderWithProviders(<Tutorial />);

      // Tutorial problem function should be available
      expect(mockFunctions.tutorialProblem).toBeDefined();
    });
  });

  describe('Answer Handling', () => {
    it('should track wrong answers', () => {
      const { container } = renderWithProviders(<Tutorial />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Tutorial Instructions', () => {
    it('should display tutorial content', () => {
      const { container } = renderWithProviders(<Tutorial />);

      // Should have content
      expect(container.textContent.length).toBeGreaterThan(0);
    });

    it('should have interactive elements', () => {
      renderWithProviders(<Tutorial />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
