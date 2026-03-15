import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScriptsPanel from '../ScriptsPanel';
import { renderWithProviders } from '../../test-utils/test-utils';

jest.mock('../../context/ChimesConfigContext', () => ({
  ChimesConfigProvider: ({ children }) => children,
  useChimesConfig: () => ({ chimesConfig: {}, updateChimesConfig: jest.fn() }),
}));

const mockScript = {
  message_groups: {
    start_conversation: { messages: ['hello', 'hi'] },
    agree: { messages: ['yes'] },
  },
};

const mockChatBoxRef = { current: { startTypingSimulation: jest.fn() } };

describe('ScriptsPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when currentScript is null', () => {
    const { container } = renderWithProviders(
      <ScriptsPanel currentScript={null} chatBoxRef={mockChatBoxRef} typingWpm={60} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders script groups when currentScript is provided', () => {
    renderWithProviders(
      <ScriptsPanel currentScript={mockScript} chatBoxRef={mockChatBoxRef} typingWpm={60} />
    );
    expect(screen.getByText('Initiating conversations')).toBeInTheDocument();
  });

  it('shows expand all button by default', () => {
    renderWithProviders(
      <ScriptsPanel currentScript={mockScript} chatBoxRef={mockChatBoxRef} typingWpm={60} />
    );
    expect(screen.getByText('Expand All')).toBeInTheDocument();
  });

  it('toggles to collapse all on click', async () => {
    renderWithProviders(
      <ScriptsPanel currentScript={mockScript} chatBoxRef={mockChatBoxRef} typingWpm={60} />
    );
    await userEvent.click(screen.getByText('Expand All'));
    expect(screen.getByText('Collapse All')).toBeInTheDocument();
  });

  it('calls startTypingSimulation when script item is clicked', async () => {
    renderWithProviders(
      <ScriptsPanel currentScript={mockScript} chatBoxRef={mockChatBoxRef} typingWpm={60} />
    );
    await userEvent.click(screen.getByText('hello'));
    expect(mockChatBoxRef.current.startTypingSimulation).toHaveBeenCalledWith('hello', expect.any(Number));
  });

  it('shows not-allowed cursor while simulating', async () => {
    renderWithProviders(
      <ScriptsPanel currentScript={mockScript} chatBoxRef={mockChatBoxRef} typingWpm={60} />
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveStyle({ cursor: 'pointer' });

    await userEvent.click(screen.getByText('hello'));
    screen.getAllByRole('listitem').forEach(li => {
      expect(li).toHaveStyle({ cursor: 'not-allowed' });
    });
  });
});
