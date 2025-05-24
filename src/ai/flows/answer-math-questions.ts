'use server';
/**
 * @fileOverview This file defines a Genkit flow for answering math questions.
 *
 * The flow takes a math question as input and returns a step-by-step solution.
 *
 * @exports {
 *   answerMathQuestions: (input: AnswerMathQuestionsInput) => Promise<AnswerMathQuestionsOutput>;
 *   AnswerMathQuestionsInput: z.infer<typeof AnswerMathQuestionsInputSchema>;
 *   AnswerMathQuestionsOutput: z.infer<typeof AnswerMathQuestionsOutputSchema>;
 *   calculatorTool: GenkitTool;
 * }
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnswerMathQuestionsInputSchema = z.object({
  question: z.string().describe('The math question to be answered.'),
});

export type AnswerMathQuestionsInput = z.infer<typeof AnswerMathQuestionsInputSchema>;

const AnswerMathQuestionsOutputSchema = z.object({
  solution: z.string().describe('The step-by-step solution to the math question.'),
});

export type AnswerMathQuestionsOutput = z.infer<typeof AnswerMathQuestionsOutputSchema>;

async function calculateExpression(expression: string): Promise<number> {
  // Basic implementation for demonstration purposes.
  // In a real-world scenario, use a more robust expression parser and evaluator.
  try {
    // eslint-disable-next-line no-eval
    return eval(expression);
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return NaN; // Indicate an error
  }
}

export const calculatorTool = ai.defineTool({
  name: 'calculator',
  description: 'Parse and execute arithmetic expressions. Can be used for basic math operations like addition, subtraction, multiplication, division, and exponentiation.',
  inputSchema: z.object({
    expression: z.string().describe('The arithmetic expression to evaluate (e.g., "2+2", "10/5", "3^2")'),
  }),
  outputSchema: z.number(),
},
async (input) => {
  const result = await calculateExpression(input.expression);
  return result;
});

const answerMathQuestionsPrompt = ai.definePrompt({
  name: 'answerMathQuestionsPrompt',
  input: { schema: AnswerMathQuestionsInputSchema },
  output: { schema: AnswerMathQuestionsOutputSchema },
  tools: [calculatorTool],
  prompt: `You are a math tutor. Provide a step-by-step solution to the following math question. If needed, use the calculator tool to perform calculations.

Question: {{{question}}}

Solution:`, // Enforce step-by-step solutions.
});

const answerMathQuestionsFlow = ai.defineFlow({
  name: 'answerMathQuestionsFlow',
  inputSchema: AnswerMathQuestionsInputSchema,
  outputSchema: AnswerMathQuestionsOutputSchema,
}, async (input) => {
  const { output } = await answerMathQuestionsPrompt(input);
  return output!;
});

export async function answerMathQuestions(input: AnswerMathQuestionsInput): Promise<AnswerMathQuestionsOutput> {
  return answerMathQuestionsFlow(input);
}
