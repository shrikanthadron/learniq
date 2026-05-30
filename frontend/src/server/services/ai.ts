import Groq from "groq-sdk";

const groq = process.env.GROQ_API_KEY
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

export interface GeneratedQuestion {
  type: "MCQ" | "TRUE_FALSE" | "FILL_BLANK" | "SHORT_ANSWER";
  text: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export async function generateQuizQuestions(
  topic: string,
  count: number,
  difficulty: string,
  types: string[]
): Promise<GeneratedQuestion[]> {
  const prompt = `Generate ${count} study quiz questions for topic "${topic}" at ${difficulty} difficulty.
Question types to include: ${types.join(", ")}.
Return ONLY valid JSON array with objects: { type, text, options (array for MCQ), correctAnswer, explanation, difficulty }.
No markdown, no preamble.`;

  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      });
      const content = completion.choices[0]?.message?.content || "[]";
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]) as GeneratedQuestion[];
    } catch (e) {
      console.warn("Groq API failed, using fallback:", e);
    }
  }

  return getFallbackQuestions(topic, count, difficulty);
}

export async function summarizeNotes(content: string): Promise<string> {
  if (groq && content.length > 50) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Summarize these study notes in 3-5 bullet points:\n\n${content.slice(0, 8000)}`,
          },
        ],
        max_tokens: 512,
      });
      return completion.choices[0]?.message?.content || fallbackSummary(content);
    } catch {
      return fallbackSummary(content);
    }
  }
  return fallbackSummary(content);
}

export async function getStudyRecommendations(
  weakTopics: string[],
  goals: string,
  recentScores: number[]
): Promise<{ dailyTopics: string[]; revisionPlan: string; practiceSessions: string[] }> {
  const avg = recentScores.length
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 70;

  if (groq) {
    try {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `As an adaptive learning coach, given weak topics: ${weakTopics.join(", ")}, goals: ${goals}, avg quiz score ${avg}%.
Return JSON only: { dailyTopics: string[], revisionPlan: string, practiceSessions: string[] }`,
          },
        ],
        max_tokens: 512,
      });
      const content = completion.choices[0]?.message?.content || "";
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      /* fallback */
    }
  }

  return {
    dailyTopics: weakTopics.length ? weakTopics.slice(0, 3) : ["Review fundamentals", "Practice problems", "Timed quiz"],
    revisionPlan: `Focus on weak areas with 25-min Pomodoro blocks. Target accuracy above ${Math.min(95, avg + 10)}%.`,
    practiceSessions: ["Morning: concept review", "Afternoon: adaptive quiz", "Evening: spaced repetition flashcards"],
  };
}

function fallbackSummary(content: string): string {
  const lines = content.split("\n").filter((l) => l.trim()).slice(0, 5);
  return lines.map((l) => `• ${l.trim().slice(0, 120)}`).join("\n") || "• Key concepts captured from your notes.";
}

function getFallbackQuestions(
  topic: string,
  count: number,
  difficulty: string
): GeneratedQuestion[] {
  const templates: GeneratedQuestion[] = [
    {
      type: "MCQ",
      text: `What is a core concept in ${topic}?`,
      options: ["Fundamental principle", "Unrelated term", "Optional detail", "Historical note"],
      correctAnswer: "Fundamental principle",
      explanation: "The fundamental principle is central to understanding this topic.",
      difficulty: difficulty as GeneratedQuestion["difficulty"],
    },
    {
      type: "TRUE_FALSE",
      text: `${topic} requires consistent practice to master.`,
      correctAnswer: "true",
      explanation: "Spaced repetition and practice improve retention.",
      difficulty: difficulty as GeneratedQuestion["difficulty"],
    },
    {
      type: "FILL_BLANK",
      text: `The study of ${topic} begins with understanding _______.`,
      correctAnswer: "basics",
      explanation: "Strong foundations in basics support advanced learning.",
      difficulty: difficulty as GeneratedQuestion["difficulty"],
    },
    {
      type: "SHORT_ANSWER",
      text: `Explain one key application of ${topic} in 1-2 sentences.`,
      correctAnswer: "application",
      explanation: "Applications connect theory to real-world problem solving.",
      difficulty: difficulty as GeneratedQuestion["difficulty"],
    },
  ];
  const result: GeneratedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const t = templates[i % templates.length];
    result.push({ ...t });
  }
  return result;
}
