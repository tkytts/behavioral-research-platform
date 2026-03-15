import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider , initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import InputModal from '../InputModal';

// Initialize test i18n instance
// eslint-disable-next-line import/no-named-as-default-member
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: { understood: 'Understood' } },
  },
  interpolation: { escapeValue: false },
});

const mockInputRef = {
  getBoundingClientRect: () => ({
    top: 100,
    left: 100,
    right: 200,
    bottom: 150,
    width: 100,
    height: 50,
  }),
};

const renderInputModal = (props) => {
  return render(
    <I18nextProvider i18n={testI18n}>
      <InputModal inputRef={mockInputRef} {...props} />
    </I18nextProvider>
  );
};

describe('InputModal', () => {
  it('renders the modal with text', () => {
    renderInputModal({
      text: 'Test instruction text',
      onUnderstood: jest.fn()
    });
    
    expect(screen.getByText('Test instruction text')).toBeInTheDocument();
  });

  it('renders the understood button', () => {
    renderInputModal({
      text: 'Test text',
      onUnderstood: jest.fn()
    });
    
    expect(screen.getByRole('button', { name: /understood/i })).toBeInTheDocument();
  });

  it('calls onUnderstood when button is clicked', () => {
    const onUnderstood = jest.fn();
    
    renderInputModal({
      text: 'Test text',
      onUnderstood
    });
    
    fireEvent.click(screen.getByRole('button', { name: /understood/i }));
    
    expect(onUnderstood).toHaveBeenCalledTimes(1);
  });

  it('renders 4 overlay strips that exclude the highlighted area', () => {
    renderInputModal({
      text: 'Test text',
      onUnderstood: jest.fn()
    });

    const topStrip = screen.getByTestId('top-overlay');
    const bottomStrip = screen.getByTestId('bottom-overlay');
    const leftStrip = screen.getByTestId('left-overlay');
    const rightStrip = screen.getByTestId('right-overlay');

    // INSET = 6; highlightTop = inputPosition.top - INSET = 100 - 6 = 94
    expect(topStrip.style.height).toBe('94px');
    // highlightHeight = inputPosition.height + INSET * 2 = 50 + 12 = 62; bottom top = 94 + 62 = 156
    expect(bottomStrip.style.top).toBe('156px');
    // highlightLeft = inputPosition.left - INSET = 100 - 6 = 94
    expect(leftStrip.style.width).toBe('94px');
    // highlightWidth = inputPosition.width + INSET * 2 = 100 + 12 = 112; right left = 94 + 112 = 206
    expect(rightStrip.style.left).toBe('206px');
  });
});
