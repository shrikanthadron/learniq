export interface ExamOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  subjects: string[];
}

export interface GateBranch {
  slug: string;
  name: string;
  icon: string;
  syllabus: string[];
}

export const EXAM_OPTIONS: ExamOption[] = [
  {
    id: "JEE",
    label: "JEE",
    description: "Physics, Chemistry & Mathematics",
    icon: "🎓",
    subjects: ["physics", "chemistry", "mathematics"],
  },
  {
    id: "NEET",
    label: "NEET",
    description: "Physics, Chemistry & Biology",
    icon: "🩺",
    subjects: ["physics", "chemistry", "biology"],
  },
  {
    id: "GATE",
    label: "GATE",
    description: "Engineering branch syllabus tracker",
    icon: "⚙️",
    subjects: [],
  },
  {
    id: "CET",
    label: "CET",
    description: "State entrance — PCM + Biology",
    icon: "📋",
    subjects: ["mathematics", "physics", "chemistry", "biology"],
  },
];

export const GATE_BRANCHES: GateBranch[] = [
  {
    slug: "gate-cs",
    name: "Computer Science",
    icon: "💻",
    syllabus: [
      "Engineering Mathematics",
      "Digital Logic",
      "Computer Organization",
      "Programming & Data Structures",
      "Algorithms",
      "Theory of Computation",
      "Compiler Design",
      "Operating Systems",
      "Databases",
      "Computer Networks",
    ],
  },
  {
    slug: "gate-ec",
    name: "Electronics & Communication",
    icon: "📡",
    syllabus: [
      "Engineering Mathematics",
      "Networks & Signals",
      "Electronic Devices",
      "Analog Circuits",
      "Digital Circuits",
      "Control Systems",
      "Communications",
      "Electromagnetics",
    ],
  },
  {
    slug: "gate-ee",
    name: "Electrical Engineering",
    icon: "⚡",
    syllabus: [
      "Engineering Mathematics",
      "Electric Circuits",
      "Electromagnetic Fields",
      "Signals & Systems",
      "Electrical Machines",
      "Power Systems",
      "Control Systems",
      "Power Electronics",
    ],
  },
  {
    slug: "gate-me",
    name: "Mechanical Engineering",
    icon: "🔧",
    syllabus: [
      "Engineering Mathematics",
      "Engineering Mechanics",
      "Mechanics of Materials",
      "Theory of Machines",
      "Vibrations",
      "Fluid Mechanics",
      "Thermodynamics",
      "Heat Transfer",
      "Manufacturing",
    ],
  },
  {
    slug: "gate-ce",
    name: "Civil Engineering",
    icon: "🏗️",
    syllabus: [
      "Engineering Mathematics",
      "Structural Analysis",
      "Concrete Structures",
      "Steel Structures",
      "Geotechnical Engineering",
      "Fluid Mechanics",
      "Hydraulics",
      "Environmental Engineering",
      "Transportation",
    ],
  },
  {
    slug: "gate-in",
    name: "Instrumentation Engineering",
    icon: "📊",
    syllabus: [
      "Engineering Mathematics",
      "Electrical Circuits",
      "Signals & Systems",
      "Control Systems",
      "Sensors & Transducers",
      "Industrial Instrumentation",
      "Communication & Optical",
      "Biomedical Instrumentation",
    ],
  },
];

export const EXAM_SUBJECT_SLUGS: Record<string, string[]> = {
  JEE: ["physics", "chemistry", "mathematics"],
  NEET: ["physics", "chemistry", "biology"],
  GATE: GATE_BRANCHES.map((b) => b.slug),
  CET: ["mathematics", "physics", "chemistry", "biology"],
};

export function getGateBranch(slug?: string | null): GateBranch | undefined {
  if (!slug) return undefined;
  return GATE_BRANCHES.find((b) => b.slug === slug);
}

export function getUserGateBranch(goals?: Record<string, unknown> | null): string {
  const branch = goals?.gateBranch;
  return typeof branch === "string" ? branch : GATE_BRANCHES[0].slug;
}
