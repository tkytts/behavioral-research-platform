import { screen, within } from '@testing-library/react';
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
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('David');
  });

  it('shows starting problem dropdown with options 1–5', () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    const problemSelect = selects[selects.length - 1];
    const options = within(problemSelect).getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('1');
    expect(options[4]).toHaveTextContent('5');
  });

  it('defaults starting problem to the first (index 0)', () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects[selects.length - 1]).toHaveValue('0');
  });

  it('includes startingProblemIndex: 0 in onSave payload by default', async () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    await userEvent.click(screen.getByText('start'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ startingProblemIndex: 0 })
    );
  });

  it('includes selected startingProblemIndex in onSave payload', async () => {
    renderWithProviders(<GameConfigModal {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[selects.length - 1], '3'); // selects displayed option "3" (problem number), which has value 2 (0-based index)
    await userEvent.click(screen.getByText('start'));
    expect(defaultProps.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ startingProblemIndex: 2 })
    );
  });

  it('resets startingProblemIndex to 0 when modal is reopened', async () => {
    const { rerender } = renderWithProviders(<GameConfigModal {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    await userEvent.selectOptions(selects[selects.length - 1], '3');

    rerender(<GameConfigModal {...defaultProps} isOpen={false} />);
    rerender(<GameConfigModal {...defaultProps} isOpen={true} />);

    const updatedSelects = screen.getAllByRole('combobox');
    expect(updatedSelects[updatedSelects.length - 1]).toHaveValue('0');
  });
});
