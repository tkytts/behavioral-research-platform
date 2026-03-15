import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResolutionModal from '../ResolutionModal';
import { renderWithProviders } from '../../test-utils/test-utils';

jest.mock('../../context/ChimesConfigContext', () => ({
  ChimesConfigProvider: ({ children }) => children,
  useChimesConfig: () => ({ chimesConfig: {}, updateChimesConfig: jest.fn() }),
}));

jest.mock('../../realtime/game', () => ({
  setGameResolution: jest.fn(),
}));

jest.mock('../Modal', () => {
  return function Modal({ children, onClose }) {
    return (
      <div data-testid="modal">
        {children}
        {onClose && <button onClick={onClose}>close</button>}
      </div>
    );
  };
});

const mockGame = require('../../realtime/game');
global.alert = jest.fn();

describe('ResolutionModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when closed', () => {
    renderWithProviders(<ResolutionModal isOpen={false} onClose={jest.fn()} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('calls setGameResolution and onClose when AP is clicked with answer', async () => {
    const onClose = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={onClose} />);

    await userEvent.type(screen.getByRole('textbox'), 'some answer');
    await userEvent.click(screen.getByText('AP'));

    expect(mockGame.setGameResolution).toHaveBeenCalledWith({ gameResolutionType: 'AP', teamAnswer: 'some answer' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls setGameResolution with empty teamAnswer for TNP', async () => {
    const onClose = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={onClose} />);

    await userEvent.click(screen.getByText('TNP'));

    expect(mockGame.setGameResolution).toHaveBeenCalledWith({ gameResolutionType: 'TNP', teamAnswer: '' });
    expect(onClose).toHaveBeenCalled();
  });

  it('alerts when no answer provided for non-TNP', async () => {
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    await userEvent.click(screen.getByText('AP'));

    expect(global.alert).toHaveBeenCalled();
    expect(mockGame.setGameResolution).not.toHaveBeenCalled();
  });

  it('resets teamAnswer when reopened', async () => {
    const { rerender } = renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    await userEvent.type(screen.getByRole('textbox'), 'typed text');
    rerender(<ResolutionModal isOpen={false} onClose={jest.fn()} />);
    rerender(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
