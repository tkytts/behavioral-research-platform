import { screen } from '@testing-library/react';

import ExperimenterDashboard from '../ExperimenterDashboard';
import { renderWithProviders } from '../../test-utils/test-utils';

jest.mock('../../context/ChimesConfigContext', () => ({
  ChimesConfigProvider: ({ children }) => children,
  useChimesConfig: () => ({ chimesConfig: {}, updateChimesConfig: jest.fn() }),
}));

const scriptData = {
  resolutions: [
    { problem: 0, resolution: 'AP' },
    { problem: 1, resolution: 'DNP' },
  ],
};

const suggestions = [
  ['sugA1', 'sugA2'],
  ['sugB1', 'sugB2'],
];

describe('ExperimenterDashboard', () => {
  it('shows problem number (1-based)', () => {
    renderWithProviders(
      <ExperimenterDashboard currentProblem={0} currentScript={scriptData} currentConfederateIndex={0} suggestions={suggestions} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('shows expected resolution', () => {
    renderWithProviders(
      <ExperimenterDashboard currentProblem={0} currentScript={scriptData} currentConfederateIndex={0} suggestions={suggestions} />
    );
    expect(screen.getByText('AP')).toBeInTheDocument();
  });

  it('shows suggestion for current confederate and problem', () => {
    renderWithProviders(
      <ExperimenterDashboard currentProblem={0} currentScript={scriptData} currentConfederateIndex={0} suggestions={suggestions} />
    );
    expect(screen.getByText('sugA1')).toBeInTheDocument();
  });

  it('hides resolution when currentScript is null', () => {
    renderWithProviders(
      <ExperimenterDashboard currentProblem={0} currentScript={null} currentConfederateIndex={0} suggestions={suggestions} />
    );
    expect(screen.queryByText('Resolution')).not.toBeInTheDocument();
  });
});
