# 🧠 AI Research Supervisor (MVP)

An ecosystem that helps university students turn a vague research idea into a structured, academically valid thesis plan.

## 🚀 Overview

This MVP is a **Full-Stack Next.js Application**:
- **Frontend:** Next.js App Router with Tailwind CSS and a modern glassmorphism UI.
- **Backend:** Next.js API Routes (`/api/...`) powered by the Gemini SDK (`@google/generative-ai`) for robust AI generation logic.
- **Database:** Supabase integration ready (currently using localStorage for seamless, key-less immediate demoing of the frontend logic).

## 🛠 Prerequisites

- Node.js (v18+)
- Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

## ⚙️ Setup Instructions

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Configure your API Key:
   Create a `.env.local` file in the `frontend` directory and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   *The application will be available at `http://localhost:3000`.*

## 🌟 MVP Features

1. **🧩 Research Idea Builder**: Refines a topic into titles, problem statements, research questions, hypotheses, and scope.
2. **📚 Thesis Structure Generator**: Drafts chapter breakdowns and subsections based on academic field.
3. **🧪 Methodology Advisor**: Recommends qualitative, quantitative, or mixed methods along with data collection strategies and tools.
4. **📝 Supervisor Check**: Provides instant feedback on written text, highlighting strengths, weaknesses, and actionable improvements.

## 🧱 Architecture

- **Full Stack Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS v4
- **AI Engine**: `@google/generative-ai` (Gemini 1.5 Pro)
- **Database Architecture**: Structured mapping to `@supabase/supabase-js`.
>>>>>>> 15c81e664594900919eb9cbd48e3f42981b7943a
