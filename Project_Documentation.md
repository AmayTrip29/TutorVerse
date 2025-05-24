
# TutorVerse - Project Documentation

## 1. Introduction

This document provides a comprehensive overview of the TutorVerse project, including its system design, architecture, technology stack, and a detailed breakdown of its folder and file structure. It is intended for developers working on or seeking to understand the internals of the TutorVerse application. This document aims to be thorough enough to allow a developer to grasp the project's intricacies as if they had built it from the ground up.

## 2. System Design & Architecture

TutorVerse is an AI-powered tutoring application designed to assist users with math and physics questions. Its architecture is built around a Next.js frontend, Genkit for AI orchestration, and specialized AI agents for different subjects. The design prioritizes a clear separation of concerns, modularity for maintainability, and a reactive user experience.

### Core Components:

1.  **Frontend (Client-Side)**:
    *   **Technology**: Built with Next.js (App Router), React, and TypeScript.
    *   **Purpose**: Provides the user interface (UI) for users to input their questions and view the AI-generated answers. It's designed as a single-page application (SPA) for a fluid experience.
    *   **Key Components**:
        *   `src/app/page.tsx`: The main page component that orchestrates the UI. It uses React's `useActionState` hook to manage form submissions and display responses.
        *   `src/components/query-input-form.tsx`: A client component allowing users to type and submit their questions.
        *   `src/components/answer-display.tsx`: A client component responsible for rendering the formatted response from the AI tutor.
    *   **Styling**: ShadCN UI components are used for pre-built, accessible UI elements, styled with Tailwind CSS for a modern, responsive, and utility-first approach to design. The theme (colors, fonts) is defined in `src/app/globals.css`.

2.  **Server Actions (Next.js)**:
    *   **Location**: `src/app/actions.ts`.
    *   **Purpose**: Act as the critical bridge between the client-side UI and the backend AI logic (Genkit flows). When a user submits a question, the form data is sent to a Server Action.
    *   **Functionality**:
        *   Receives the user's query from the form.
        *   Performs initial validation (e.g., checking if the question is empty).
        *   Invokes the appropriate Genkit AI flows (first the query router, then the subject-specific agent).
        *   Formats the AI's response into a `TutorResponse` object suitable for display on the frontend.
        *   Handles errors gracefully, providing user-friendly messages.
    *   **Benefits**: Using Server Actions simplifies data mutations and backend communication directly from React components without needing to manually create API endpoints for these interactions.

3.  **Genkit AI Flows (Backend AI Logic)**:
    *   **Environment**: Managed by Genkit, running in a Node.js environment. These are server-side functions.
    *   **Global Configuration**: `src/ai/genkit.ts` initializes the global Genkit `ai` instance, configuring it with the Google AI plugin (for Gemini models) and setting a default model.
    *   **Development Server**: `src/ai/dev.ts` is the entry point for running Genkit in development mode. It loads environment variables (like the `GOOGLE_API_KEY` from `.env`) and imports all flow files to register them with the Genkit development server.
    *   **Core Flows**:
        *   **Intelligent Query Router (`src/ai/flows/intelligent-query-routing.ts`)**:
            *   **Input**: User's raw query string.
            *   **Process**: Uses a Gemini model with a specific prompt to classify the query as "Math" or "Physics". This is a crucial first step to direct the query to the correct specialized agent.
            *   **Output**: A route string ("Math" or "Physics").
            *   **Schema**: Uses Zod schemas (`IntelligentQueryRoutingInputSchema`, `IntelligentQueryRoutingOutputSchema`) for type-safe input and output.
        *   **Math Sub-Agent (`src/ai/flows/answer-math-questions.ts`)**:
            *   **Input**: The math question.
            *   **Process**: Invoked if the query is classified as "Math". It uses a specialized prompt and a Gemini model to generate step-by-step math solutions.
            *   **Tools**: Has access to a **Calculator Tool** (`calculatorTool`) defined within this flow. The LLM can decide to use this tool if it needs to perform arithmetic calculations as part of generating the solution. The tool is defined using `ai.defineTool` with input/output schemas and a function that evaluates the expression.
            *   **Output**: A structured solution string.
            *   **Schema**: Uses Zod schemas (`AnswerMathQuestionsInputSchema`, `AnswerMathQuestionsOutputSchema`).
        *   **Physics Sub-Agent (`src/ai/flows/answer-physics-questions.ts`)**:
            *   **Input**: The physics question.
            *   **Process**: Invoked if the query is classified as "Physics". It uses a specialized prompt and a Gemini model to answer physics questions, explain concepts, and solve problems.
            *   **Tools**: Has access to two tools:
                1.  **Constant Lookup Tool (`getConstant`)**: Fetches values of physical constants (e.g., speed of light, Planck's constant) from `src/data/physical-constants.json`. The LLM is prompted to use this tool when it needs a specific constant.
                2.  **Calculator Tool**: Imported from the math sub-agent (`answer-math-questions.ts`) for numerical calculations.
            *   **Output**: A structured answer string and a list of constants used.
            *   **Schema**: Uses Zod schemas (`AnswerPhysicsQuestionInputSchema`, `AnswerPhysicsQuestionOutputSchema`).

4.  **Data**:
    *   `src/data/physical-constants.json`: A static JSON file storing a collection of common physical constants (name, value, unit, symbol). This provides a reliable data source for the Physics Sub-Agent's `getConstant` tool.

### Interaction Flow (Step-by-Step):

1.  **User Input**: The user types a question into the `<textarea>` within the `QueryInputForm` component (`src/components/query-input-form.tsx`) on the main page (`src/app/page.tsx`).
2.  **Form Submission**:
    *   Pressing "Enter" (without Shift) or clicking the "Ask TutorVerse" button in `QueryInputForm` submits the form.
    *   This form submission is handled by the `formAction` prop, which is the `dispatch` function returned by the `useActionState` hook initialized in `src/app/page.tsx`.
3.  **Server Action Invocation**:
    *   The `useActionState` hook in `page.tsx` is configured with the `askTutor` Server Action (`src/app/actions.ts`).
    *   `askTutor` receives the current state and the `FormData` from the form.
4.  **Query Validation**: `askTutor` first checks if the submitted question is empty. If so, it returns an error `TutorResponse`.
5.  **Intelligent Query Routing**:
    *   `askTutor` creates an `IntelligentQueryRoutingInput` object containing the user's question.
    *   It then `await`s the `intelligentQueryRouting` Genkit flow from `src/ai/flows/intelligent-query-routing.ts`.
    *   The `intelligentQueryRoutingFlow` uses a Gemini model to classify the query based on its content, returning "Math" or "Physics".
6.  **Sub-Agent Invocation**:
    *   **If "Math"**:
        *   `askTutor` creates an `AnswerMathQuestionsInput` object.
        *   It `await`s the `answerMathQuestions` flow from `src/ai/flows/answer-math-questions.ts`.
        *   The `answerMathQuestionsFlow` uses its specialized prompt. If the LLM determines a calculation is needed, it will output a "tool call" request for the `calculatorTool`. Genkit handles executing the tool (which calls the `calculateExpression` TypeScript function) and feeding the result back to the LLM. The LLM then uses this result to continue generating the step-by-step solution.
        *   The flow returns an `AnswerMathQuestionsOutput` containing the solution.
    *   **If "Physics"**:
        *   `askTutor` creates an `AnswerPhysicsQuestionInput` object.
        *   It `await`s the `answerPhysicsQuestion` flow from `src/ai/flows/answer-physics-questions.ts`.
        *   The `answerPhysicsQuestionFlow` uses its specialized prompt. The LLM can decide to:
            *   Use the `getConstant` tool: If it needs a physical constant, it requests it by key name. Genkit executes the tool (which looks up the constant in `physical-constants.json`), and the constant's value and unit are returned to the LLM.
            *   Use the `calculatorTool`: If calculations are needed.
        *   The LLM formulates an answer using the tool results and its knowledge.
        *   The flow returns an `AnswerPhysicsQuestionOutput` containing the answer and a list of `constantsUsed` (key names).
7.  **Response Formatting**: `askTutor` takes the output from the sub-agent flow and constructs a `TutorResponse` object. This object includes:
    *   `type`: 'math', 'physics', or 'error'.
    *   `solution` (for math) or `answer` and `constantsUsed` (for physics).
    *   `originalQuery`: The user's question.
    *   `timestamp`.
8.  **State Update & UI Re-render**:
    *   The `TutorResponse` object is returned by `askTutor`.
    *   The `useActionState` hook in `page.tsx` automatically updates its `state` with this new response.
    *   React re-renders `page.tsx`. The updated `state` is passed as the `response` prop to the `AnswerDisplay` component.
9.  **Display Answer**: `AnswerDisplay` (`src/components/answer-display.tsx`) renders the information from the `TutorResponse` object, appropriately formatting math solutions, physics answers, constants, or error messages. It uses a `key={timestamp}` prop to ensure it re-renders distinctly for new responses.

### Error Handling:

*   **Empty Input**: Handled in `askTutor` before calling any AI flow.
*   **AI Flow Errors**: `try...catch` blocks in `askTutor` catch exceptions from Genkit flows (e.g., API errors, tool execution errors, schema validation failures).
*   **Specific Error Messages**: The catch block in `askTutor` attempts to provide more specific error messages if it detects common issues like API key problems or timeouts.
*   **UI Display**: Errors are displayed in the `AnswerDisplay` component using an `<Alert variant="destructive">`.

## 3. Technology Stack

This section details the technologies used and their specific roles in TutorVerse.

*   **Next.js (v15.x)**:
    *   **Role**: Full-stack React framework. Chosen for its robust features for building modern web applications, including server-side rendering, static site generation, and simplified routing.
    *   **Usage**:
        *   **App Router**: For file-system based routing, nested layouts, and improved server-side capabilities.
        *   **Server Components**: Used by default for pages and layouts to reduce client-side JavaScript and improve initial load times.
        *   **Client Components (`'use client';`)**: Used for interactive UI elements like forms and components that rely on React hooks (`useState`, `useEffect`, `useActionState`).
        *   **Server Actions (`'use server';`)**: For handling form submissions and backend logic directly from React components, simplifying the client-server communication model.
        *   **`next/image`**: For optimizing images (though primarily used for placeholders in this project).
*   **React (v18.x)**:
    *   **Role**: JavaScript library for building user interfaces. The foundation of the frontend.
    *   **Usage**:
        *   Building reusable UI components (`QueryInputForm`, `AnswerDisplay`, ShadCN components).
        *   Managing component state and lifecycle with hooks:
            *   `useActionState` (in `page.tsx`): Manages form state and handles asynchronous operations triggered by form submissions to Server Actions.
            *   `useState`, `useEffect`, `useRef` (in various components): For local component state, side effects, and direct DOM manipulation/references.
*   **TypeScript**:
    *   **Role**: Superset of JavaScript that adds static typing.
    *   **Usage**: Used across the entire project (frontend, server actions, Genkit flows) to enhance code quality, readability, and maintainability by catching type errors during development. Improves developer experience through better autocompletion and code navigation.
*   **ShadCN UI**:
    *   **Role**: Collection of beautifully designed, accessible UI components that are *copied* into the project rather than installed as a typical library. This allows for full customization.
    *   **Usage**: Provides pre-built components like `Card`, `Button`, `Textarea`, `Badge`, `Alert`, etc., located in `src/components/ui/`. These components are then customized via `components.json` and styled directly with Tailwind CSS.
*   **Tailwind CSS**:
    *   **Role**: Utility-first CSS framework. Chosen for rapid UI development and easy customization.
    *   **Usage**: Styling all UI components and layout. Theming (colors, fonts, etc.) is configured in `tailwind.config.ts` and through CSS variables defined in `src/app/globals.css`.
*   **Genkit (v1.x)**:
    *   **Role**: Framework from Google for building AI-powered applications. It simplifies interaction with Large Language Models (LLMs) and the creation of AI agents with tools.
    *   **Usage**:
        *   Defining and orchestrating AI flows (`ai.defineFlow`).
        *   Integrating with Google's Gemini models via the `googleAI` plugin.
        *   Defining tools (`ai.defineTool`) that LLMs can use as part of their reasoning process (e.g., `calculatorTool`, `getConstant`).
        *   Managing prompts (`ai.definePrompt`) with Handlebars templating.
        *   Located primarily in the `src/ai/` directory.
*   **Zod**:
    *   **Role**: TypeScript-first schema declaration and validation library.
    *   **Usage**: Defining the expected input and output schemas for Genkit flows and tools. This ensures data integrity when interacting with AI models and between different parts of the application. Genkit leverages Zod schemas for type safety and for structuring the data passed to/from LLMs.
*   **Lucide-react**:
    *   **Role**: Icon library providing a wide range of simple, consistent SVG icons.
    *   **Usage**: Provides icons used throughout the UI (e.g., `BrainCircuit`, `Calculator`, `Atom`, `Send`, `Loader2`).
*   **Dotenv**:
    *   **Role**: Loads environment variables from a `.env` file into `process.env`.
    *   **Usage**: Used in `src/ai/dev.ts` (the Genkit development server entry point) to load the `GOOGLE_API_KEY` for local development. **Crucially, the `.env` file is not for production and must not be committed to Git.**
*   **Geist Font**:
    *   **Role**: Modern, clean sans-serif font family.
    *   **Usage**: Configured in `src/app/layout.tsx` via `next/font/google` to provide a consistent and readable typography for the application.

## 4. Project Folder and File Structure

This section provides a detailed walkthrough of the project's structure, explaining the purpose of key directories and files.

```
TutorVerse/
├── .env                   # Stores environment variables (e.g., API keys) - NOT COMMITTED TO GIT
├── .gitignore             # Specifies intentionally untracked files that Git should ignore (e.g., node_modules, .env, .next, .idx)
├── .vscode/               # VS Code editor specific settings (optional, user-specific)
│   └── settings.json
├── README.md              # Primary project overview, setup, and usage instructions for users/contributors
├── PROJECT_DOCUMENTATION.md # This file - detailed developer documentation
├── apphosting.yaml        # Configuration for Firebase App Hosting (if used for deployment)
├── components.json        # ShadCN UI configuration file (defines paths, style, etc.)
├── next.config.ts         # Next.js configuration file (build options, image domains, etc.)
├── package.json           # Lists project dependencies (npm packages) and scripts (dev, build, etc.)
├── tailwind.config.ts     # Tailwind CSS configuration file (theme, plugins, content paths)
├── tsconfig.json          # TypeScript compiler options for the project
├── src/                   # Main application source code
│   ├── ai/                # Genkit and AI-related logic
│   │   ├── flows/         # Core Genkit AI flows
│   │   │   ├── answer-math-questions.ts    # Math question answering agent and its calculator tool.
│   │   │   ├── answer-physics-questions.ts # Physics question answering agent, its constant lookup tool, and imports the calculator tool.
│   │   │   └── intelligent-query-routing.ts# Agent for routing queries to Math or Physics sub-agents.
│   │   ├── dev.ts         # Entry point for running Genkit in development mode (`npm run genkit:dev`). Loads .env and registers all flows.
│   │   └── genkit.ts      # Global Genkit configuration: initializes `ai` object with plugins (googleAI) and default model.
│   ├── app/               # Next.js App Router directory
│   │   ├── actions.ts     # Server Actions: `askTutor` function handles form submissions, orchestrates AI flow invocations, and formats responses.
│   │   ├── globals.css    # Global styles: Tailwind base/components/utilities directives, CSS custom properties (variables) for theming (light/dark modes).
│   │   ├── layout.tsx     # Root layout component for all pages. Wraps all page content, applies global fonts (Geist), includes `<Toaster />`.
│   │   └── page.tsx       # Main (and only) page component for the application UI. Sets up the page structure, integrates `QueryInputForm` and `AnswerDisplay`, and uses `useActionState` to manage form interaction with `askTutor` server action.
│   ├── components/        # Reusable React components
│   │   ├── ui/            # ShadCN UI components (e.g., button.tsx, card.tsx). These are typically "use client" components.
│   │   ├── answer-display.tsx # Client component to render the tutor's response (math solution, physics answer, errors, etc.).
│   │   └── query-input-form.tsx# Client component for user to input questions. Contains the textarea and submit button.
│   ├── data/              # Static data files used by the application
│   │   └── physical-constants.json # JSON file storing physical constants (key, name, value, unit, symbol) used by the Physics agent's `getConstant` tool.
│   ├── hooks/             # Custom React hooks
│   │   ├── use-mobile.tsx # Hook to detect if the user is on a mobile device (currently unused but available for future responsive logic).
│   │   └── use-toast.ts   # Hook for managing toast notifications, used by `<Toaster />` in `layout.tsx`.
│   └── lib/               # Utility functions
│       └── utils.ts       # General utility functions, notably `cn` for merging Tailwind CSS classes with `clsx`.
└── node_modules/          # Directory where npm installs project dependencies (managed by package.json, ignored by Git).
```

### Key File Deep Dive:

*   **`package.json`**:
    *   `scripts`: Defines command-line shortcuts for common tasks:
        *   `dev`: Runs the Next.js development server (usually on `http://localhost:9002`).
        *   `genkit:dev`: Starts the Genkit development server (usually on `http://localhost:4000`) which hosts your AI flows.
        *   `genkit:watch`: Same as `genkit:dev` but restarts automatically on file changes.
        *   `build`: Creates a production-optimized build of the Next.js application.
        *   `start`: Starts the Next.js production server (after running `build`).
        *   `lint`: Runs ESLint for code linting.
        *   `typecheck`: Runs the TypeScript compiler to check for type errors without emitting JavaScript files.
    *   `dependencies`: Lists packages required for the application to run (e.g., `next`, `react`, `genkit`, `@genkit-ai/googleai`, `zod`, `lucide-react`, ShadCN component dependencies).
    *   `devDependencies`: Lists packages needed for development (e.g., `typescript`, `tailwindcss`, `eslint`).

*   **`next.config.ts`**:
    *   Configures Next.js. For this project, it includes settings to:
        *   Ignore TypeScript and ESLint errors during build (for faster iteration, but should be addressed for production).
        *   Define `remotePatterns` for `next/image` to allow images from `placehold.co`.

*   **`tailwind.config.ts`**:
    *   Configures Tailwind CSS. Defines:
        *   `darkMode: ["class"]`: Enables dark mode based on a class on the `<html>` tag.
        *   `content`: Paths to files Tailwind should scan for utility classes.
        *   `theme.extend`: Customizations to the default Tailwind theme:
            *   `colors`: Defines custom color names (e.g., `background`, `foreground`, `primary`, `secondary`, `accent`, `destructive`, `card`, `popover`, `border`, `input`, `ring`) using HSL CSS variables from `globals.css`. This allows for easy theming.
            *   `borderRadius`: Defines custom border radius values.
            *   `fontFamily`: Sets `geistSans` as the default sans-serif font.
            *   `keyframes` and `animation`: Defines custom animations like `accordion-down`, `accordion-up`, and `fadeIn`.
    *   `plugins`: Includes `tailwindcss-animate` for animation utilities.

*   **`src/app/layout.tsx`**:
    *   The root layout component. It's a Server Component.
    *   Sets up the basic HTML structure (`<html>`, `<body>`).
    *   Applies the `Geist` font globally using `next/font/google`.
    *   Includes the `<Toaster />` component from ShadCN, which is necessary for displaying toast notifications managed by `useToast`.
    *   Renders `{children}`, which will be the content of the current page (in this case, `page.tsx`).

*   **`src/app/page.tsx` (`'use client';`)**:
    *   The main UI page. It's a Client Component because it uses `useActionState`.
    *   **State Management**: Uses `const [state, formAction] = useActionState(askTutor, initialState);`
        *   `askTutor`: The Server Action to call on form submission.
        *   `initialState`: The initial state of the `TutorResponse`.
        *   `state`: The current `TutorResponse` object (updated after `askTutor` completes).
        *   `formAction`: The function to pass to the `<form>`'s `action` prop. This function will be called by React when the form is submitted, and it internally handles calling `askTutor` with the form data.
    *   **Structure**: Sets up a flex column layout with a header (title and tagline), a main content area for the `QueryInputForm` and `AnswerDisplay`, and a footer with credits.
    *   **Conditional Rendering**: `AnswerDisplay` is rendered based on the `state` to show initial messages or subsequent responses. The `key={state.timestamp}` on `AnswerDisplay` ensures it re-mounts and re-animates when the response content changes significantly.

*   **`src/app/actions.ts` (`'use server';`)**:
    *   Defines the `askTutor` Server Action.
    *   **`TutorResponse` interface**: Defines the structure of the object returned to the client, containing the type of response, answer/solution, original query, etc.
    *   **Logic**:
        1.  Retrieves the `question` from `formData`.
        2.  Validates if the question is empty.
        3.  Calls `intelligentQueryRouting` flow.
        4.  Based on the route ('Math' or 'Physics'), calls the respective sub-agent flow (`answerMathQuestions` or `answerPhysicsQuestion`).
        5.  Constructs and returns the `TutorResponse` object.
        6.  Includes `try...catch` for error handling.

*   **`src/ai/genkit.ts`**:
    *   Initializes the global `ai` object from Genkit.
    *   `plugins: [googleAI()]`: Registers the Google AI plugin, enabling the use of Gemini models.
    *   `model: 'googleai/gemini-2.0-flash'`: Sets a default model for Genkit operations if not specified elsewhere. (Note: PRD mentions Gemini, specific version might vary, `gemini-pro` is common).

*   **`src/ai/flows/*.ts` files (e.g., `answer-math-questions.ts`)**:
    *   `'use server';`: Directive often used at the top, though for Genkit flows directly called by Server Actions, it's the Server Action itself that truly runs on the server. However, Genkit flows *are* server-side code.
    *   **Zod Schemas**: Define `...InputSchema` and `...OutputSchema` for strong typing of flow inputs and outputs. These are critical for Genkit's structured prompting and tool use.
    *   **`ai.defineTool(...)`**: Defines tools the LLM can use.
        *   `name`: A unique identifier for the tool.
        *   `description`: Crucial for the LLM to understand *when* and *why* to use the tool.
        *   `inputSchema`: Zod schema for the tool's input.
        *   `outputSchema`: Zod schema for the tool's output.
        *   Async function: The actual TypeScript code that executes when the tool is called.
    *   **`ai.definePrompt(...)`**: Defines a prompt configuration.
        *   `name`: A unique identifier for the prompt.
        *   `input`: `{ schema: ...InputSchema }`.
        *   `output`: `{ schema: ...OutputSchema }`. The LLM will attempt to structure its response according to this schema.
        *   `tools`: An array of tools available to this prompt (e.g., `[calculatorTool]`).
        *   `prompt`: The actual prompt string given to the LLM. Uses Handlebars templating (e.g., `{{{question}}}`) to insert input values. It instructs the LLM on its role, task, and how to use available tools.
    *   **`ai.defineFlow(...)`**: Defines the main flow logic.
        *   `name`: A unique identifier for the flow.
        *   `inputSchema` and `outputSchema`.
        *   Async function: Takes the input, calls the defined prompt (`await prompt(input)`), and returns the `output` from the LLM's response.
    *   **Exported Wrapper Function**: An async function (e.g., `export async function answerMathQuestions(...)`) that simply calls the defined flow. This is the function imported and used by `src/app/actions.ts`.

*   **`src/components/query-input-form.tsx` (`'use client';`)**:
    *   A Client Component.
    *   **Props**: Receives `formAction` (the dispatch from `page.tsx`'s `useActionState`) and `currentState`.
    *   **Form**: A standard HTML `<form>` that uses the received `formAction`.
    *   **`SubmitButton`**: A sub-component that uses `useFormStatus()` from `react-dom` to display a loading state ("Thinking...") while the Server Action is pending.
    *   **Enter Key Submission**: `useEffect` adds an event listener to the textarea to submit the form when "Enter" is pressed (without Shift).
    *   **`useRef`**: Used to get references to the form and textarea for programmatic interactions (like `formRef.current?.requestSubmit()`).

*   **`src/components/answer-display.tsx` (`'use client';`)**:
    *   A Client Component.
    *   **Props**: Receives `response: TutorResponse`.
    *   **Conditional Rendering**: Displays different UI elements based on `response.type` ('math', 'physics', 'error', 'general').
    *   **Formatting**: Formats text (splitting newlines into `<br />`), displays solutions, answers, constants used (with badges), and error messages using ShadCN `Card` and `Alert` components.
    *   **Icons**: Uses Lucide icons to visually distinguish response types.
    *   The `animate-fadeIn` class and `key={timestamp}` prop enhance the visual feedback when new responses arrive.

*   **`src/data/physical-constants.json`**:
    *   A simple key-value store. Each key (e.g., "speedOfLight") maps to an object containing the constant's full name, numerical value, unit, and common symbol. This structured data is easily parsed by the `getConstant` tool in the physics agent.

## 5. Running the Project Locally

Refer to the main `README.md` for detailed step-by-step instructions on setting up and running the project locally. Key aspects include:
*   Installing dependencies (`npm install`).
*   Setting up the `.env` file with your `GOOGLE_API_KEY`.
*   Running the Genkit development server (`npm run genkit:watch` or `npm run genkit:dev`).
*   Running the Next.js development server (`npm run dev`).

## 6. API Key Security & Deployment Considerations

*   **Local Development**: The `GOOGLE_API_KEY` is loaded from the `.env` file by `dotenv` in `src/ai/dev.ts`. This is solely for local development convenience.
*   **CRITICAL: `.env` File Security**:
    *   The `.env` file **MUST NEVER** be committed to Git or any version control system. It contains your secret API key.
    *   The `.gitignore` file is configured to ignore `.env`, preventing accidental commits.
*   **Production Deployment**:
    *   When deploying to a hosting provider (e.g., Vercel, Firebase Hosting, Netlify, AWS Amplify), you **DO NOT** upload the `.env` file.
    *   Instead, you set the `GOOGLE_API_KEY` as an **environment variable** directly in the hosting provider's dashboard or configuration settings.
    *   The deployed Next.js application (and its Server Actions/Genkit flows running in that environment) will automatically have access to `process.env.GOOGLE_API_KEY` provided by the hosting platform. This is the secure way to handle API keys in production.

This detailed documentation aims to provide a solid and deep understanding of TutorVerse's architecture, components, and codebase, enabling any developer to effectively contribute to or maintain the project.

    