import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider , initReactI18next } from 'react-i18next';
import i18n from 'i18next';


import ChatBox from '../ChatBox';
import { ChimesConfigProvider } from '../../context/ChimesConfigContext';

// Mock realtime/game module before imports
jest.mock('../../realtime/game', () => ({
  connectionReady: Promise.resolve(),
  onReceiveMessage: jest.fn(),
  offReceiveMessage: jest.fn(),
  onUserTyping: jest.fn(),
  offUserTyping: jest.fn(),
  onNewConfederate: jest.fn(),
  offNewConfederate: jest.fn(),
  onChatCleared: jest.fn(),
  offChatCleared: jest.fn(),
  sendMessage: jest.fn().mockResolvedValue(undefined),
  typing: jest.fn().mockResolvedValue(undefined),
  clearChat: jest.fn().mockResolvedValue(undefined),
  getChimes: jest.fn().mockResolvedValue(undefined),
  telemetryEvent: jest.fn().mockResolvedValue(undefined),
  onChimesUpdated: jest.fn(),
  offChimesUpdated: jest.fn(),
  setChimes: jest.fn().mockResolvedValue(undefined),
}));

const gameModule = require('../../realtime/game');

// Initialize test i18n instance
// eslint-disable-next-line import/no-named-as-default-member
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        messages: 'Messages',
        player_name: 'Player',
        send_message: 'Send',
        clear_chat: 'Clear Chat',
        message_placeholder: 'Type a message...',
        activity: 'Activity',
        is_typing: 'is typing',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const renderChatBox = (props = {}) => {
  const defaultProps = {
    currentUser: 'TestUser',
    isAdmin: false,
    messageRef: { current: null },
    chatRef: { current: null },
    confederateNameRef: { current: null },
    activityRef: { current: null },
    sendButtonRef: { current: null },
  };

  return render(
    <I18nextProvider i18n={testI18n}>
      <BrowserRouter>
        <ChimesConfigProvider>
          <ChatBox {...defaultProps} {...props} />
        </ChimesConfigProvider>
      </BrowserRouter>
    </I18nextProvider>
  );
};

describe('ChatBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the chat box with header', () => {
    renderChatBox();
    
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('renders message input field', () => {
    renderChatBox();
    
    expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  it('renders send button', () => {
    renderChatBox();
    
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('shows clear chat button for admin users', () => {
    renderChatBox({ isAdmin: true });
    
    expect(screen.getByRole('button', { name: /clear chat/i })).toBeInTheDocument();
  });

  it('does not show clear chat button for non-admin users', () => {
    renderChatBox({ isAdmin: false });
    
    expect(screen.queryByRole('button', { name: /clear chat/i })).not.toBeInTheDocument();
  });

  it('updates input value when typing', async () => {
    renderChatBox();
    
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Hello world' } });
    
    expect(input).toHaveValue('Hello world');
  });

  it('calls sendMessage when send button is clicked', async () => {
    renderChatBox();
    
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    expect(gameModule.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'TestUser',
        text: 'Test message',
      })
    );
  });

  it('clears input after sending message', async () => {
    renderChatBox();
    
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    expect(input).toHaveValue('');
  });

  it('does not send empty messages', async () => {
    renderChatBox();
    
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    expect(gameModule.sendMessage).not.toHaveBeenCalled();
  });

  it('calls typing when user types', async () => {
    renderChatBox();
    
    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'H' } });
    
    expect(gameModule.typing).toHaveBeenCalledWith('TestUser');
  });

  it('calls clearChat when clear button is clicked (admin)', async () => {
    renderChatBox({ isAdmin: true });
    
    fireEvent.click(screen.getByRole('button', { name: /clear chat/i }));
    
    expect(gameModule.clearChat).toHaveBeenCalled();
  });

  it('registers event handlers on mount', () => {
    renderChatBox();
    
    expect(gameModule.onReceiveMessage).toHaveBeenCalled();
    expect(gameModule.onUserTyping).toHaveBeenCalled();
    expect(gameModule.onNewConfederate).toHaveBeenCalled();
    expect(gameModule.onChatCleared).toHaveBeenCalled();
  });

  it('shows activity section', () => {
    renderChatBox();
    
    expect(screen.getByText(/activity/i)).toBeInTheDocument();
  });

  it('displays current user name for non-admin', () => {
    renderChatBox({ currentUser: 'Player1' });

    expect(screen.getByText('Player1')).toBeInTheDocument();
  });
});

describe('ChatBox startTypingSimulation (forwardRef)', () => {
  const renderWithRef = (ref, extraProps = {}) => {
    const defaultProps = {
      currentUser: 'TestUser',
      isAdmin: false,
      messageRef: { current: null },
      chatRef: { current: null },
      confederateNameRef: { current: null },
      activityRef: { current: null },
      sendButtonRef: { current: null },
    };
    return render(
      <I18nextProvider i18n={testI18n}>
        <ChimesConfigProvider>
          <ChatBox ref={ref} {...defaultProps} {...extraProps} />
        </ChimesConfigProvider>
      </I18nextProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('exposes startTypingSimulation via forwardRef', () => {
    const ref = React.createRef();
    renderWithRef(ref);
    expect(typeof ref.current.startTypingSimulation).toBe('function');
  });

  it('fills the input field character by character', () => {
    const ref = React.createRef();
    renderWithRef(ref);
    const input = screen.getByPlaceholderText(/type a message/i);

    act(() => {
      ref.current.startTypingSimulation('hi', 50);
      jest.advanceTimersByTime(50);
    });
    expect(input).toHaveValue('h');

    act(() => {
      jest.advanceTimersByTime(50);
    });
    expect(input).toHaveValue('hi');
  });

  it('calls typing() on each character for non-admin', () => {
    const ref = React.createRef();
    renderWithRef(ref, { currentUser: 'Participant' });

    act(() => {
      ref.current.startTypingSimulation('ab', 10);
      jest.advanceTimersByTime(20);
    });

    expect(gameModule.typing).toHaveBeenCalledWith('Participant');
    expect(gameModule.typing).toHaveBeenCalledTimes(2);
  });

  it('uses confederate name for typing indicator when isAdmin', () => {
    let confederateHandler;
    gameModule.onNewConfederate.mockImplementation((handler) => {
      confederateHandler = handler;
    });

    const ref = React.createRef();
    renderWithRef(ref, { isAdmin: true });

    act(() => {
      confederateHandler('Alice');
    });

    act(() => {
      ref.current.startTypingSimulation('x', 10);
      jest.advanceTimersByTime(10);
    });

    expect(gameModule.typing).toHaveBeenCalledWith('Alice');
  });
});
