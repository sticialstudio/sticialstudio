import fs from "fs";
import path from "path";
import "server-only";

type CourseMode = "block" | "text";
type CourseEnvironment = "virtual" | "physical";

export interface CourseLesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  board: string;
  mode: CourseMode;
  language: string;
  generator: string;
  environment: CourseEnvironment;
  difficulty: string;
  sourceLabel: string;
}

export interface CourseTrack {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  lessonCount: number;
  lessons: CourseLesson[];
}

function findProjectsRoot(): string {
  const candidates = [
    path.join(process.cwd(), "Projects"),
    path.resolve(process.cwd(), "..", "..", "Projects"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function stripArtifacts(value: string): string {
  return value
    .replace(/[\uFE0F\u20E3\uFFFD]/g, "")
    .replace(/â€”/g, "-")
    .replace(/â€º/g, ">")
    .replace(/Î©/g, "ohm")
    .replace(/ï¸/g, "")
    .replace(/âƒ£/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return stripArtifacts(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "lesson";
}

function cleanLabel(value: string): string {
  return stripArtifacts(value)
    .replace(/^\d+[._\-\s]*/g, "")
    .replace(/_/g, " ")
    .replace(/\.(md|docx|pdf)$/i, "")
    .trim();
}

function firstParagraph(markdown: string): string {
  const lines = markdown
    .split(/\r?\n/)
    .map((line) => stripArtifacts(line))
    .filter(Boolean);

  for (const line of lines) {
    if (
      line.startsWith("#") ||
      line.startsWith("##") ||
      line.startsWith("---") ||
      line.startsWith("|") ||
      line.startsWith("```") ||
      line.startsWith("**What") ||
      line.startsWith("Step ")
    ) {
      continue;
    }

    if (line.length > 36) {
      return line;
    }
  }

  return "Follow the guided build and programming steps to complete this hardware lesson.";
}

function detectBoard(markdown: string, fallback: string): string {
  const normalized = markdown.toLowerCase();
  if (normalized.includes("raspberry pi pico 2 w") || normalized.includes("pico 2 w") || normalized.includes("pico 2w")) {
    return "Raspberry Pi Pico 2W";
  }
  if (normalized.includes("raspberry pi pico w")) {
    return "Raspberry Pi Pico W";
  }
  if (normalized.includes("raspberry pi pico")) {
    return "Raspberry Pi Pico";
  }
  if (normalized.includes("arduino uno")) {
    return "Arduino Uno";
  }
  return fallback;
}

function readCoderLessons(root: string): CourseLesson[] {
  const manualsDir = path.join(root, "1. CODER", "Manuals 1.0");
  if (!fs.existsSync(manualsDir)) return [];

  return fs.readdirSync(manualsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry, index) => {
      const title = cleanLabel(entry.name);
      return {
        id: `coder-${index + 1}`,
        slug: slugify(title),
        title,
        summary: `Practice ${title.toLowerCase()} concepts with beginner-friendly circuit builds, guided wiring, and quick feedback loops.`,
        board: "Arduino Uno",
        mode: "block",
        language: "cpp",
        generator: "arduino",
        environment: "virtual",
        difficulty: "Starter",
        sourceLabel: "CODER Manual",
      };
    });
}

function readAiderLessons(root: string): CourseLesson[] {
  const studentDir = path.join(root, "2. AIDER", "Curriculum", "Intermediate", "Student");
  if (!fs.existsSync(studentDir)) return [];

  return fs.readdirSync(studentDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry, index) => {
      const fullPath = path.join(studentDir, entry.name);
      const content = fs.readFileSync(fullPath, "utf8");
      const heading = content.match(/^#\s+(.+)$/m)?.[1] || cleanLabel(entry.name);
      const title = cleanLabel(heading.replace(/^Project\s+\d+:\s*/i, ""));
      const board = detectBoard(content, "Raspberry Pi Pico 2W");

      return {
        id: `aider-${index + 1}`,
        slug: slugify(title),
        title,
        summary: firstParagraph(content),
        board,
        mode: "text",
        language: "python",
        generator: "micropython",
        environment: "physical",
        difficulty: "Guided Build",
        sourceLabel: "AIDER Student Manual",
      };
    });
}

function readRovaLessons(root: string): CourseLesson[] {
  const rovaDir = path.join(root, "3.ROVA");
  if (!fs.existsSync(rovaDir)) return [];

  return [
    {
      id: "rova-1",
      slug: "program-the-rover",
      title: "Program the Rover",
      summary: "Learn rover control basics through a guided robotics manual, then carry the logic into your own block-based or text-based builds.",
      board: "Arduino Uno",
      mode: "block",
      language: "cpp",
      generator: "arduino",
      environment: "physical",
      difficulty: "Robotics",
      sourceLabel: "ROVA Manual",
    },
  ];
}

export function getCourseCatalog(): CourseTrack[] {
  const root = findProjectsRoot();
  const coderLessons = readCoderLessons(root);
  const aiderLessons = readAiderLessons(root);
  const rovaLessons = readRovaLessons(root);

  return [
    {
      slug: "coder",
      title: "CODER",
      subtitle: "Circuit foundations",
      description: "Starter lessons for LEDs, buttons, ultrasonic sensing, servo motion, and breadboard confidence.",
      lessonCount: coderLessons.length,
      lessons: coderLessons,
    },
    {
      slug: "aider",
      title: "AIDER",
      subtitle: "Connected hardware projects",
      description: "Structured project-based learning for Wi-Fi, IoT dashboards, cloud logging, and embedded automation.",
      lessonCount: aiderLessons.length,
      lessons: aiderLessons,
    },
    {
      slug: "rova",
      title: "ROVA",
      subtitle: "Robotics journey",
      description: "Hands-on rover programming lessons that connect movement, sensors, and guided robotics workflows.",
      lessonCount: rovaLessons.length,
      lessons: rovaLessons,
    },
  ];
}

export function getCourseTrack(trackSlug: string): CourseTrack | null {
  return getCourseCatalog().find((track) => track.slug === trackSlug) || null;
}

