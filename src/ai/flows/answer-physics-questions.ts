'use server';
/**
 * @fileOverview Physics question answering flow.
 *
 * - answerPhysicsQuestion - A function that answers physics questions using Gemini, a constant lookup tool, and a calculator tool.
 * - AnswerPhysicsQuestionInput - The input type for the answerPhysicsQuestion function.
 * - AnswerPhysicsQuestionOutput - The return type for the answerPhysicsQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { calculatorTool } from './answer-math-questions'; // Import the calculator tool
import physicalConstantsData from '@/data/physical-constants.json';

const AnswerPhysicsQuestionInputSchema = z.object({
  question: z.string().describe('The physics question to answer.'),
});
export type AnswerPhysicsQuestionInput = z.infer<typeof AnswerPhysicsQuestionInputSchema>;

const AnswerPhysicsQuestionOutputSchema = z.object({
  answer: z.string().describe('The answer to the physics question.'),
  constantsUsed: z.array(z.string()).describe('The key names of the physical constants used in the answer (e.g., "speedOfLight").'),
});
export type AnswerPhysicsQuestionOutput = z.infer<typeof AnswerPhysicsQuestionOutputSchema>;

export async function answerPhysicsQuestion(input: AnswerPhysicsQuestionInput): Promise<AnswerPhysicsQuestionOutput> {
  return answerPhysicsQuestionFlow(input);
}

// Type assertion for the imported JSON data
const allPhysicalConstants: Record<string, { name: string; value: number; unit: string; symbol: string }> = physicalConstantsData;

const getConstant = ai.defineTool(
  {
    name: 'getConstant',
    description: 'Looks up a physical constant by its key name (e.g., "speedOfLight", "plancksConstant", "electronMass"). Returns the constant as a string with its value and unit.',
    inputSchema: z.object({
      name: z.string().describe('The key name of the constant to look up (e.g., "speedOfLight", "gravitationalConstant").'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const constantKey = input.name as keyof typeof allPhysicalConstants;
    const constant = allPhysicalConstants[constantKey];
    if (!constant) {
      throw new Error(`Constant with key "${input.name}" not found. Please use a valid key name like "speedOfLight", "plancksConstant", etc. Refer to the available constants list if unsure.`);
    }
    return `${constant.value} ${constant.unit}`;
  }
);

const answerPhysicsQuestionPrompt = ai.definePrompt({
  name: 'answerPhysicsQuestionPrompt',
  input: {schema: AnswerPhysicsQuestionInputSchema},
  output: {schema: AnswerPhysicsQuestionOutputSchema},
  tools: [getConstant, calculatorTool], // Added calculatorTool
  prompt: `You are a physics tutor. Answer the following physics question. 
You can use the 'getConstant' tool to look up physical constants by their key name (e.g., 'speedOfLight', 'plancksConstant', 'electronMass'). 
You also have a 'calculator' tool for arithmetic expressions (e.g., "2*3.14", "9.8^2").
When providing the solution, clearly state any constants used by their full name and value with units.
In the 'constantsUsed' output field, list the key names of the constants you retrieved using the 'getConstant' tool.

Question: {{{question}}}

Answer:`,
});

const answerPhysicsQuestionFlow = ai.defineFlow(
  {
    name: 'answerPhysicsQuestionFlow',
    inputSchema: AnswerPhysicsQuestionInputSchema,
    outputSchema: AnswerPhysicsQuestionOutputSchema,
  },
  async input => {
    const {output} = await answerPhysicsQuestionPrompt(input);
    return output!;
  }
);
