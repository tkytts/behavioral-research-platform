import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameConfigModal from '../GameConfigModal';
import { renderWithProviders } from '../../test-utils/test-utils';

jest.mock('../../context/ChimesConfigContext', () => ({
  ChimesConfigProvider: ({ children }) => children,
  useChimesConfig: () => ({ chimesConfig: {}, updateChimesConfig: jest.fn() }),
}));

jest.mock('../Modal', () => {
  return function Modal({ children }) {
    return <div data-testid="modal">{children}</div>;
  };
});

const femaleConfederates = [{ name: 'Alice', order: 1 }, { name: 'Beth', order: 3 }];
const maleConfederates = [{ name: 'David', order: 2 }];

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  confederatesFemaleStart: femaleConfederates,
  confederatesMaleStart: maleConfederates,
  initialConfederateName: 'Alice',
  initialGender: 'F',
};

describe('GameConfigModal', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when closed', () => {
    renderWithProviders(<GameConfigModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  it('shows female radio as default', () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    expect(screen.getByRole('radio', { name: /female/i })).toBeChecked();
  });

  it('shows default points value of 7', () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(7);
  });

  it('shows default max time of 75', () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[1]).toHaveValue(75);
  });

  it('calls onSave with correct payload when start clicked', async () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    await userEvent.click(screen.getByText('start'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        confederateName: 'Alice',
        gender: 'F',
        pointsAwarded: 7,
        maxTimeInput: 75,
        chimes: { messageSent: true, messageReceived: true, timer: true },
      })
    );
  });

  it('calls onClose when cancel clicked', async () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    await userEvent.click(screen.getByText('cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('switches to male confederates when M is selected', async () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    const radios = screen.getAllByRole('radio');
    const maleRadio = radios.find(r => r.value === 'M');
    await userEvent.click(maleRadio);
    expect(maleRadio).toBeChecked();
    expect(screen.getByRole('combobox')).toHaveValue('David');
  });
});
