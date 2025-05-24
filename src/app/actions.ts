// @ts-nocheck
// remove-ts-nocheck-next-line
'use server';

import { intelligentQueryRouting, IntelligentQueryRoutingInput, IntelligentQueryRoutingOutput } from '@/ai/flows/intelligent-query-routing';
import { answerMathQuestions, AnswerMathQuestionsInput, AnswerMathQuestionsOutput } from '@/ai/flows/answer-math-questions';
import { answerPhysicsQuestion, AnswerPhysicsQuestionInput, AnswerPhysicsQuestionOutput } from '@/ai/flows/answer-physics-questions';

export interface TutorResponse {
  type: 'math' | 'physics' | 'error' | 'general' | 'empty';
  answer?: string;
  constantsUsed?: string[];
  solution?: string;
  error?: string;
  originalQuery: string;
  timestamp: number;
}

const initialResponse: TutorResponse = {
  type: 'general',
  answer: 'Welcome to TutorVerse! Ask me anything about Math or Physics.',
  originalQuery: '',
  timestamp: Date.now(),
};

export async function askTutor(prevState: TutorResponse, formData: FormData): Promise<TutorResponse> {
  const question = formData.get('question') as string;

  if (!question || typeof question !== 'string' || question.trim() === '') {
    return {
      type: 'error',
      error: 'Question cannot be empty. Please enter your question.',
      originalQuery: '',
      timestamp: Date.now(),
    };
  }

  try {
    const routingInput: IntelligentQueryRoutingInput = { query: question };
    const routingResult: IntelligentQueryRoutingOutput = await intelligentQueryRouting(routingInput);

    if (routingResult.route === 'Math') {
      const mathInput: AnswerMathQuestionsInput = { question };
      const mathResult: AnswerMathQuestionsOutput = await answerMathQuestions(mathInput);
      return {
        type: 'math',
        solution: mathResult.solution,
        originalQuery: question,
        timestamp: Date.now(),
      };
    } else if (routingResult.route === 'Physics') {
      const physicsInput: AnswerPhysicsQuestionInput = { question };
      const physicsResult: AnswerPhysicsQuestionOutput = await answerPhysicsQuestion(physicsInput);
      return {
        type: 'physics',
        answer: physicsResult.answer,
        constantsUsed: physicsResult.constantsUsed,
        originalQuery: question,
        timestamp: Date.now(),
      };
    } else {
      // This case should ideally not be reached if router is robust
      return {
        type: 'error',
        error: 'Could not determine the subject. Please try rephrasing your question or be more specific.',
        originalQuery: question,
        timestamp: Date.now(),
      };
    }
  } catch (e: any) {
    console.error("Error in askTutor:", e);
    let errorMessage = 'An unexpected error occurred while processing your question. Please try again later.';
    
    if (e && e.message) {
      const lowerCaseMessage = e.message.toLowerCase();
      if (
        lowerCaseMessage.includes('api key') ||
        lowerCaseMessage.includes('invalid api key') ||
        lowerCaseMessage.includes('api_key') ||
        lowerCaseMessage.includes('permission denied') ||
        lowerCaseMessage.includes('access token')
      ) {
        errorMessage = 'There seems to be an issue with the API configuration. Please contact support if this persists.';
      } else if (
        lowerCaseMessage.includes('quota') ||
        lowerCaseMessage.includes('limit exceeded') ||
        lowerCaseMessage.includes('resource has been exhausted') ||
        lowerCaseMessage.includes('billing')
      ) {
        errorMessage = 'The AI service is currently experiencing high demand or a usage limit has been reached. Please try again in a little while.';
      } else if (lowerCaseMessage.includes('timeout')) {
        errorMessage = 'The request to the AI service timed out. Please try again.';
      } else if (lowerCaseMessage.includes('model_not_found') || lowerCaseMessage.includes('model not found')) {
        errorMessage = 'The AI model is currently unavailable. Please try again later.';
      }
    }
    
    return {
      type: 'error',
      error: errorMessage,
      originalQuery: question,
      timestamp: Date.now(),
    };
  }
}
