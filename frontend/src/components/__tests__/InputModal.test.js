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
    const { container } = renderInputModal({
      text: 'Test text',
      onUnderstood: jest.fn()
    });

    const children = container.firstChild.children;
    const [topStrip, bottomStrip, leftStrip, rightStrip] = children;

    // top: inputPosition.top = 100
    expect(topStrip.style.height).toBe('100px');
    // bottom: top = inputPosition.top + inputPosition.height = 150
    expect(bottomStrip.style.top).toBe('150px');
    // left: width = inputPosition.left = 100
    expect(leftStrip.style.width).toBe('100px');
    // right: left = inputPosition.left + inputPosition.width = 200
    expect(rightStrip.style.left).toBe('200px');
  });
});
