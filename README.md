# TutorVerse - AI-Powered Math & Physics Tutor

TutorVerse is an intelligent tutoring system designed to assist users with mathematics and physics questions. It leverages Google's Gemini API through Genkit to understand user queries, route them to the appropriate specialized agent (Math or Physics), and provide detailed answers and solutions.

## Architecture

TutorVerse is built with a modern web stack:

*   **Frontend**: Next.js (App Router) with React and TypeScript for a dynamic and type-safe user interface.
*   **UI Components**: ShadCN UI components for a polished and accessible look and feel, styled with Tailwind CSS.
*   **Backend/AI Logic**: Genkit, a framework for building AI-powered applications.
    *   **Intelligent Query Router**: A Genkit flow (`intelligent-query-routing.ts`) that uses Gemini to classify user queries as either "Math" or "Physics".
    *   **Math Sub-Agent**: A Genkit flow (`answer-math-questions.ts`) that handles math-related questions. It utilizes:
        *   **Calculator Tool**: A Genkit tool for performing arithmetic calculations.
    *   **Physics Sub-Agent**: A Genkit flow (`answer-physics-questions.ts`) that handles physics-related questions. It utilizes:
        *   **Constant Lookup Tool**: A Genkit tool to fetch physical constants from a predefined JSON dataset (`physical-constants.json`).
        *   **Calculator Tool**: Shared with the Math sub-agent for calculations.
*   **Styling**: Tailwind CSS with a custom theme defined in `src/app/globals.css`.

## Core Features

*   **Intelligent Query Routing**: Automatically directs user questions to the correct subject expert agent.
*   **Math Tutoring**: Provides step-by-step solutions to math problems, using a calculator tool for computations.
*   **Physics Tutoring**: Answers physics questions, explains concepts, and can look up relevant physical constants and perform calculations.
*   **Web Interface**: A simple, single-column web interface for users to input questions and view responses.
*   **Secure API Key Handling**: Uses environment variables for API key management.
*   **Modular Code Structure**: Clear separation of concerns between the main agent, sub-agents, and tools.

## Local Setup

Follow these instructions to get TutorVerse running on your local machine.

### Prerequisites

*   Node.js (v18 or later recommended)
*   npm or yarn

### Dependencies

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/AmayTrip29/TutorVerse.git
    cd TutorVerse
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    # or
    # yarn install
    ```

### Environment Variables & API Key Security

TutorVerse requires a Google AI API key to interact with the Gemini models.

1.  **Create a `.env` file** in the root of your project:
    ```bash
    touch .env
    ```

2.  **Add your Google AI API key** to the `.env` file:
    ```
    GEMINI_API_KEY=YOUR_GOOGLE_AI_API_KEY
    ```
    You can obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

    **IMPORTANT SECURITY NOTE:**
    *   The `.env` file contains sensitive credentials. **NEVER commit your `.env` file to Git or any public repository.** The provided `.gitignore` file is already configured to ignore `.env` files.
    *   For **local development**, the `dotenv` package loads your API key from this `.env` file.
    *   For **deployment** (e.g., to Vercel, Firebase Hosting, Netlify, etc.), you will set your `GOOGLE_API_KEY` as an environment variable directly in your hosting provider's dashboard or configuration settings. Your deployed application will read the key from that secure environment, not from a deployed `.env` file.

## Running the Project Locally

TutorVerse consists of two main parts that need to be run concurrently: the Next.js frontend and the Genkit development server.

1.  **Start the Genkit Development Server**:
    This server runs your Genkit flows and makes them available.
    ```bash
    npm run genkit:dev
    ```
    Or, to watch for changes and automatically restart:
    ```bash
    npm run genkit:watch
    ```
    The Genkit UI will typically be available at `http://localhost:4000`.

2.  **Start the Next.js Development Server**:
    In a new terminal window/tab, run:
    ```bash
    npm run dev
    ```
    The Next.js application will typically be available at `http://localhost:9002` (as configured in `package.json`).

Open your browser and navigate to `http://localhost:9002` to use the application.

## Live Deployed Application

[TutorVerse](https://tutor-verse.vercel.app/)

## Agent Interaction and Tool Usage

1.  **User Input**: The user types a question into the web interface.
2.  **Query Routing**: The `askTutor` server action in `src/app/actions.ts` receives the question. It first calls the `intelligentQueryRouting` flow. This flow uses Gemini to determine if the question is "Math" or "Physics".
3.  **Sub-Agent Invocation**:
    *   If routed to "Math", the `answerMathQuestions` flow is invoked. This flow uses a prompt specifically designed for math tutoring and has access to the `calculatorTool`. The LLM decides if and when to use the calculator to solve parts of the problem, providing a step-by-step solution.
    *   If routed to "Physics", the `answerPhysicsQuestion` flow is invoked. This flow uses a prompt for physics tutoring and has access to two tools:
        *   `getConstant`: To look up values of physical constants (e.g., speed of light, Planck's constant) from `physical-constants.json`.
        *   `calculatorTool`: To perform necessary calculations.
        The LLM determines when to use these tools to formulate its answer.
4.  **Response Display**: The result from the chosen sub-agent (solution for math, answer and constants for physics) is returned to the frontend and displayed to the user.

Tools (like the calculator and constant lookup) are defined using `ai.defineTool`. These tools are made available to the LLM within specific prompts. The LLM is instructed on how and when it *can* use these tools, but it makes the decision to use them based on the context of the user's query. The tool then executes its predefined TypeScript function, and the result is returned to the LLM to help it generate a more accurate and complete response.

## Developer

*   **Name**: Amay Tripathi
*   **GitHub**: [AmayTrip29](https://github.com/AmayTrip29)
*   **Email**: amaytripathiwork@gmail.com

## Challenges Faced

 * Designing the intent classification for routing queries to the correct sub-agent required fine-tuning prompts to the Gemini API to minimize misclassification and ensure reliable delegation. This was overcome by iterative prompt refinement and testing with diverse query examples.

 * Implementing the Calculator tool integration posed challenges in parsing natural language inputs into executable arithmetic expressions, which was overcome by defining clear parsing rules and implementing fallback error handling for ambiguous inputs.

 * Maintaining clean separation and communication between the Tutor Agent and sub-agents demanded a solid architectural approach to keep the code modular and manageable. This was addressed by clearly defining interfaces and responsibilities for each agent and tool.

 * Handling asynchronous API calls and error states from the Gemini API required adding robust error handling and user-friendly fallback messages to maintain a smooth user experience. This was achieved by wrapping API calls in try-catch blocks and providing clear error feedback to users.

---
