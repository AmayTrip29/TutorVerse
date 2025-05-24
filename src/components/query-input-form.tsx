// @ts-nocheck
// remove-ts-nocheck-next-line
'use client';

import type {FormEvent} from 'react';
import { useEffect, useRef } from 'react'; // Removed useActionState
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import type { TutorResponse } from '@/app/actions';

interface QueryInputFormProps {
  formAction: (payload: FormData) => void; // This is the dispatch from parent's useActionState
  currentState: TutorResponse; // Receive current state from parent
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Thinking...
        </>
      ) : (
        <>
          Ask TutorVerse
          <Send className="ml-2 h-4 w-4" />
        </>
      )}
    </Button>
  );
}

export function QueryInputForm({ formAction, currentState }: QueryInputFormProps) {
  // Removed: const [state, dispatch] = useActionState(formAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Use currentState prop for effects
    if (currentState.type !== 'general' && currentState.type !== 'empty' && !currentState.error) {
       // Optionally clear form on successful submission if desired
       // formRef.current?.reset();
    }
    // No need to specifically handle error case for not resetting,
    // as the textarea will retain its value if not explicitly reset.
  }, [currentState]);

  // This new useEffect handles form submission via Enter key.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        // Check if the textarea is focused
        if (document.activeElement === textAreaRef.current) {
          event.preventDefault();
          formRef.current?.requestSubmit();
        }
      }
    };

    const currentTextAreaRef = textAreaRef.current;
    currentTextAreaRef?.addEventListener('keydown', handleKeyDown);

    return () => {
      currentTextAreaRef?.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // This effect is independent of state/props


  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Ask a Question</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Use the formAction prop (HomePage's dispatch) directly */}
        <form action={formAction} ref={formRef} className="space-y-4">
          <Textarea
            name="question"
            ref={textAreaRef}
            placeholder="Type your math or physics question here... (e.g., What is E=mc^2? or Solve 2x + 5 = 15)"
            className="min-h-[100px] text-base resize-none"
            required
            aria-label="Question input"
          />
          <div className="flex justify-end">
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
