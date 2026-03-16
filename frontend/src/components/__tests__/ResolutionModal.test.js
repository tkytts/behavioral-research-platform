import { screen, fireEvent } from '@testing-library/react';
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

  it('calls setGameResolution and onClose when AP is clicked with answer', () => {
    const onClose = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'some answer' } });
    fireEvent.click(screen.getByText('AP'));

    expect(mockGame.setGameResolution).toHaveBeenCalledWith({ gameResolutionType: 'AP', teamAnswer: 'some answer' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls setGameResolution with empty teamAnswer for TNP', () => {
    const onClose = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByText('TNP'));

    expect(mockGame.setGameResolution).toHaveBeenCalledWith({ gameResolutionType: 'TNP', teamAnswer: '' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows inline validation message when no answer provided for AP', () => {
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText('AP'));

    expect(screen.getByText('Please fill in the "Team Answer" field.')).toBeInTheDocument();
    expect(mockGame.setGameResolution).not.toHaveBeenCalled();
  });

  it('adds is-invalid class to input on validation failure', () => {
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText('AP'));

    expect(screen.getByRole('textbox')).toHaveClass('is-invalid');
  });

  it('clears validation error when user types', () => {
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText('AP'));
    expect(screen.getByText('Please fill in the "Team Answer" field.')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });

    expect(screen.queryByText('Please fill in the "Team Answer" field.')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).not.toHaveClass('is-invalid');
  });

  it('calls onResolved with "AP" when AP clicked with answer', () => {
    const onResolved = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} onResolved={onResolved} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'some answer' } });
    fireEvent.click(screen.getByText('AP'));

    expect(onResolved).toHaveBeenCalledWith('AP');
  });

  it('calls onResolved with "TNP" when TNP clicked', () => {
    const onResolved = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} onResolved={onResolved} />);

    fireEvent.click(screen.getByText('TNP'));

    expect(onResolved).toHaveBeenCalledWith('TNP');
  });

  it.each([
    ['ANP', 'ANP'],
    ['DP', 'DP'],
    ['DNP', 'DNP'],
  ])('calls onResolved with "%s" when that button is clicked', (label, type) => {
    const onResolved = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} onResolved={onResolved} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'answer' } });
    fireEvent.click(screen.getByText(label));

    expect(onResolved).toHaveBeenCalledWith(type);
  });

  it('does not call onResolved when validation fails', () => {
    const onResolved = jest.fn();
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} onResolved={onResolved} />);

    fireEvent.click(screen.getByText('AP'));

    expect(onResolved).not.toHaveBeenCalled();
  });

  it('works without onResolved prop (no crash)', () => {
    renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText('TNP'));

    // no error thrown
  });

  it('resets teamAnswer when reopened', () => {
    const { rerender } = renderWithProviders(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'typed text' } });
    rerender(<ResolutionModal isOpen={false} onClose={jest.fn()} />);
    rerender(<ResolutionModal isOpen={true} onClose={jest.fn()} />);

    expect(screen.getByRole('textbox')).toHaveValue('');
  });
});
