import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { FeatureToggleProvider, useFeatureActive, useFeatureConfig } from '../FeatureToggleContext';
import * as configApi from '../../api/config';

jest.mock('../../api/config', () => ({
  getFeatures: jest.fn(),
}));

const TestConsumer = ({ featureName }) => {
  const active = useFeatureActive(featureName);
  const config = useFeatureConfig(featureName);
  return (
    <div>
      <span data-testid="active">{String(active)}</span>
      <span data-testid="typingWpm">{config.typingWpm ?? 'undefined'}</span>
    </div>
  );
};

describe('FeatureToggleContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns defaults when getFeatures rejects', async () => {
    configApi.getFeatures.mockRejectedValue(new Error('network error'));

    render(
      <FeatureToggleProvider>
        <TestConsumer featureName="dashboard" />
      </FeatureToggleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('true');
    });
  });

  it('returns default typingWpm of 60 when getFeatures rejects', async () => {
    configApi.getFeatures.mockRejectedValue(new Error('network error'));

    render(
      <FeatureToggleProvider>
        <TestConsumer featureName="scriptsModal" />
      </FeatureToggleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('typingWpm')).toHaveTextContent('60');
    });
  });

  it('respects active: false from server', async () => {
    configApi.getFeatures.mockResolvedValue({
      dashboard: { active: false },
      scriptsModal: { active: true, typingWpm: 60 },
    });

    render(
      <FeatureToggleProvider>
        <TestConsumer featureName="dashboard" />
      </FeatureToggleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('false');
    });
  });

  it('exposes custom typingWpm from server config', async () => {
    configApi.getFeatures.mockResolvedValue({
      dashboard: { active: true },
      scriptsModal: { active: true, typingWpm: 45 },
    });

    render(
      <FeatureToggleProvider>
        <TestConsumer featureName="scriptsModal" />
      </FeatureToggleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('typingWpm')).toHaveTextContent('45');
    });
  });

  it('returns true for unknown feature name (safe default)', async () => {
    configApi.getFeatures.mockResolvedValue({});

    render(
      <FeatureToggleProvider>
        <TestConsumer featureName="nonexistent" />
      </FeatureToggleProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('active')).toHaveTextContent('true');
    });
  });
});
