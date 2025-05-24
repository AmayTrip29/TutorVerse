'use server';
/**
 * @fileOverview This flow intelligently routes user queries to the appropriate sub-agent (Math or Physics) based on the query's content.
 *
 * - intelligentQueryRouting - A function that routes the query to the appropriate sub-agent.
 * - IntelligentQueryRoutingInput - The input type for the intelligentQueryRouting function.
 * - IntelligentQueryRoutingOutput - The return type for the intelligentQueryRouting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentQueryRoutingInputSchema = z.object({
  query: z.string().describe('The question to be routed to the appropriate subject-matter expert.'),
});
export type IntelligentQueryRoutingInput = z.infer<typeof IntelligentQueryRoutingInputSchema>;

const IntelligentQueryRoutingOutputSchema = z.object({
  route: z.enum(['Math', 'Physics']).describe('The subject to which the query should be routed.'),
});
export type IntelligentQueryRoutingOutput = z.infer<typeof IntelligentQueryRoutingOutputSchema>;

export async function intelligentQueryRouting(input: IntelligentQueryRoutingInput): Promise<IntelligentQueryRoutingOutput> {
  return intelligentQueryRoutingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentQueryRoutingPrompt',
  input: {schema: IntelligentQueryRoutingInputSchema},
  output: {schema: IntelligentQueryRoutingOutputSchema},
  prompt: `Determine whether the following query is related to Math or Physics.\n\nQuery: {{{query}}}\n\nRespond with either \"Math\" or \"Physics\".`,
});

const intelligentQueryRoutingFlow = ai.defineFlow(
  {
    name: 'intelligentQueryRoutingFlow',
    inputSchema: IntelligentQueryRoutingInputSchema,
    outputSchema: IntelligentQueryRoutingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
