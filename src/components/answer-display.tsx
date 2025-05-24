// @ts-nocheck
// remove-ts-nocheck-next-line
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Bot, Calculator, Atom, AlertTriangle, HelpCircle, MessageSquare } from 'lucide-react';
import type { TutorResponse } from '@/app/actions';
import { Badge } from '@/components/ui/badge';

interface AnswerDisplayProps {
  response: TutorResponse;
}

export function AnswerDisplay({ response }: AnswerDisplayProps) {
  if (response.type === 'empty') {
    return null; // Don't render anything if the response type is 'empty'
  }
  
  const { type, originalQuery, answer, solution, constantsUsed, error, timestamp } = response;

  // Helper to format multi-line text
  const formatText = (text: string | undefined) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ));
  };

  return (
    <Card className="w-full shadow-xl mt-6 animate-fadeIn" key={timestamp}>
      <CardHeader>
        {originalQuery && (
           <div className="mb-4 p-4 border border-dashed rounded-lg bg-secondary/30">
             <div className="flex items-center text-muted-foreground mb-2">
               <HelpCircle className="h-5 w-5 mr-2 text-primary" />
               <span className="font-medium">Your Question:</span>
             </div>
             <p className="italic">{formatText(originalQuery)}</p>
           </div>
        )}
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-xl font-semibold">
            <Bot className="h-6 w-6 mr-2 text-primary" /> TutorVerse Response
          </CardTitle>
          {type === 'math' && <Badge variant="secondary" className="ml-auto"><Calculator className="h-4 w-4 mr-1" /> Math</Badge>}
          {type === 'physics' && <Badge variant="secondary" className="ml-auto"><Atom className="h-4 w-4 mr-1" /> Physics</Badge>}
          {type === 'general' && <Badge variant="outline" className="ml-auto">Info</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="border-destructive/70">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formatText(error)}</AlertDescription>
          </Alert>
        )}

        {type === 'general' && answer && (
          <p className="text-base leading-relaxed">{formatText(answer)}</p>
        )}

        {type === 'math' && solution && (
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" /> Solution:
            </h3>
            <div className="p-4 bg-muted/50 rounded-md prose prose-sm max-w-none">
              {formatText(solution)}
            </div>
          </div>
        )}

        {type === 'physics' && answer && (
          <div>
            <h3 className="font-semibold text-lg mb-2 flex items-center">
              <MessageSquare className="h-5 w-5 mr-2 text-blue-600" /> Answer:
            </h3>
            <div className="p-4 bg-muted/50 rounded-md prose prose-sm max-w-none">
                {formatText(answer)}
            </div>
            {constantsUsed && constantsUsed.length > 0 && (
              <>
                <Separator className="my-4" />
                <h4 className="font-medium text-md mb-1">Constants Used:</h4>
                <ul className="list-disc list-inside pl-2 text-sm space-y-1">
                  {constantsUsed.map((constant, index) => (
                    <li key={index}><Badge variant="outline">{constant}</Badge></li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </CardContent>
       { timestamp && type !== 'general' && type !== 'empty' &&
        <CardFooter className="text-xs text-muted-foreground justify-end">
          <span>Responded at: {new Date(timestamp).toLocaleTimeString()}</span>
        </CardFooter>
      }
    </Card>
  );
}

// Add a simple fade-in animation to globals.css or tailwind.config.js if it doesn't exist
// Example for tailwind.config.js (extend/animation):
// 'fadeIn': 'fadeIn 0.5s ease-in-out',
// keyframes: { fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } } }
// This is usually already available or can be added to globals.css
// For simplicity, the example here relies on possibly existing animation classes.
// If `animate-fadeIn` is not defined, it won't do anything or might need to be added to tailwind.config.ts
// Let's assume it will be added to tailwind config.
