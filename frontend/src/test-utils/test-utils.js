import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider , initReactI18next } from 'react-i18next';
import i18n from 'i18next';

import { ChimesConfigProvider } from '../context/ChimesConfigContext';

// Initialize test i18n instance
// eslint-disable-next-line import/no-named-as-default-member
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  resources: {
    en: {
      translation: {
        messages: 'Messages',
        player_name: 'Player',
        send_message: 'Send',
        clear_chat: 'Clear Chat',
        message_placeholder: 'Type a message...',
        activity: 'Activity',
        is_typing: 'is typing...',
        find_the_solution_to_the_problem: 'Find the solution to the problem',
        loading_problem: 'Loading problem...',
        team_answer_was: 'The team answer was',
        the_answer_was: 'The answer was',
        correct: 'correct',
        incorrect: 'incorrect',
        you_earned_points: 'You earned {{count}} points',
        '1_second_left': '1 second left',
        n_seconds_left: '{{count}} seconds left',
        time_is_up: "Time's up!",
        team_answer: 'Team answer',
        points: 'Points',
        start_timer: 'Start Timer',
        stop_timer: 'Stop Timer',
        reset_timer: 'Reset Timer',
        close: 'Close',
        understood: 'Understood',
        your_name: 'Your Name',
        tutorial_confederate_1: 'Alice',
        tutorial_confederate_2: 'Bob',
        tutorial_participant_1: 'Participant 1',
        what_do_you_think: 'What do you think?',
        the_answer_is_triangle: 'The answer is triangle',
        yes_i_think_you_are_right: 'Yes, I think you are right',
        triangle: 'Triangle',
        end_collection: 'End Session',
        collection_ended_feedback: 'Session ended. Data saved.',
        dashboard_problem: 'Problem: {{number}}',
        dashboard_expected_resolution: 'Expected: {{resolution}}',
        scripts_modal_title: 'Confederate Scripts',
        scripts_collapse_all: 'Collapse All',
        scripts_expand_all: 'Expand All',
        script_group_start_conversation: 'Initiating conversations',
        script_group_express_opinions: 'Expressing opinion',
        script_group_agree: 'Agreeing',
        script_group_disagree: 'Disagreeing',
        script_group_ask_answer_questions: 'Asking/answering questions',
        script_group_when_points_obtained: 'When points are scored',
        script_group_when_points_not_obtained: 'When points are not scored',
        script_group_laugh: 'Laughing',
        dashboard_problem_label: 'Problem',
        dashboard_expected_label: 'Resolution',
        dashboard_suggestion_label: 'Possible team answer',
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

// Custom render function that wraps components with providers
export function renderWithProviders(
  ui,
  {
    route = '/',
    ...renderOptions
  } = {}
) {
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <I18nextProvider i18n={testI18n}>
        <BrowserRouter>
          <ChimesConfigProvider>
            {children}
          </ChimesConfigProvider>
        </BrowserRouter>
      </I18nextProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    i18n: testI18n,
  };
}

export { testI18n };
