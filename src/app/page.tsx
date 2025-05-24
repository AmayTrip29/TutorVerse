// @ts-nocheck
// remove-ts-nocheck-next-line
'use client';

import { useActionState } from 'react';
import { BrainCircuit } from 'lucide-react';
import { QueryInputForm } from '@/components/query-input-form';
import { AnswerDisplay } from '@/components/answer-display';
import { askTutor, type TutorResponse } from '@/app/actions';

const initialState: TutorResponse = {
  type: 'general',
  answer: 'Welcome to TutorVerse! Ask me anything about Math or Physics. I can help you understand concepts, solve problems, and learn new things.',
  originalQuery: '',
  timestamp: Date.now(),
};

export default function HomePage() {
  const [state, formAction] = useActionState(askTutor, initialState);

  return (
    <div className="flex flex-col items-center min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background to-secondary/30">
      <header className="w-full max-w-3xl mb-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <BrainCircuit className="h-12 w-12 text-primary" data-ai-hint="brain technology" />
          <h1 className="ml-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            TutorVerse
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Your AI-powered guide through the worlds of Mathematics and Physics.
        </p>
      </header>

      <main className="w-full max-w-3xl space-y-6">
        <QueryInputForm formAction={formAction} currentState={state} />
        {/* Only render AnswerDisplay if it's not the very initial welcome message without user interaction, or if there's content to show.
            The key helps in re-rendering the component when the response changes significantly.
            The initial state has a timestamp, and formAction updates it.
            We show the initial welcome via `state` passed to AnswerDisplay.
        */}
        {(state.type !== 'general' || state.originalQuery !== '') || (initialState.type === 'general' && state.timestamp === initialState.timestamp) ? (
          <AnswerDisplay response={state} />
        ) : null}

      </main>

      <footer className="w-full max-w-3xl mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} TutorVerse. Powered by GenAI.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Developed by Amay Tripathi. Contact: <a href="mailto:amaytripathiwork@gmail.com" className="underline hover:text-primary">amaytripathiwork@gmail.com</a> | GitHub: <a href="https://github.com/AmayTrip29" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">AmayTrip29</a>
        </p>
      </footer>
    </div>
  );
}
