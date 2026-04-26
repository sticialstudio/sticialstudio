export type ToolboxLearningLevel = "starter" | "builder" | "explore";

export interface GuidedToolboxGroupDefinition {
  id: string;
  label: string;
  description: string;
  level: ToolboxLearningLevel;
  categoryNames: string[];
  keepWhenEmpty?: boolean;
}

export const TOOLBOX_LEARNING_LEVELS: ToolboxLearningLevel[] = [
  "starter",
  "builder",
  "explore",
];

const TOOLBOX_LEVEL_RANK: Record<ToolboxLearningLevel, number> = {
  starter: 0,
  builder: 1,
  explore: 2,
};

export const GUIDED_TOOLBOX_GROUPS: GuidedToolboxGroupDefinition[] = [
  {
    id: "start",
    label: "Start",
    description: "Begin your program and add timing.",
    level: "starter",
    categoryNames: ["Control"],
  },
  {
    id: "your-circuit",
    label: "Your Circuit",
    description: "Blocks that match the parts in your build.",
    level: "starter",
    categoryNames: ["My Components"],
    keepWhenEmpty: true,
  },
  {
    id: "output",
    label: "Output",
    description: "Use simple pins, sound, and built-in output.",
    level: "starter",
    categoryNames: ["Input/Output"],
  },
  {
    id: "decide",
    label: "Decide",
    description: "Make choices and repeat actions.",
    level: "builder",
    categoryNames: ["Logic", "Loops"],
  },
  {
    id: "sense",
    label: "Sensors",
    description: "Read sensors, motors, and moving parts.",
    level: "builder",
    categoryNames: ["Sensors", "Motion"],
  },
  {
    id: "numbers",
    label: "Numbers",
    description: "Work with values and simple math.",
    level: "builder",
    categoryNames: ["Math"],
  },
  {
    id: "variables",
    label: "Variables",
    description: "Remember values while your program runs.",
    level: "explore",
    categoryNames: ["Variables"],
  },
  {
    id: "functions",
    label: "Functions",
    description: "Reuse actions you build often.",
    level: "explore",
    categoryNames: ["Functions"],
  },
  {
    id: "messages",
    label: "Messages",
    description: "Use text, serial, and extra communication blocks.",
    level: "explore",
    categoryNames: ["Text", "Messaging", "Color"],
  },
  {
    id: "displays",
    label: "Displays",
    description: "Show text and graphics on screens.",
    level: "explore",
    categoryNames: ["Displays"],
  },
];

export function isLearningLevelUnlocked(
  requiredLevel: ToolboxLearningLevel,
  activeLevel: ToolboxLearningLevel,
) {
  return TOOLBOX_LEVEL_RANK[activeLevel] >= TOOLBOX_LEVEL_RANK[requiredLevel];
}

export function getGuidedToolboxGroups(activeLevel: ToolboxLearningLevel) {
  return GUIDED_TOOLBOX_GROUPS.filter((group) =>
    isLearningLevelUnlocked(group.level, activeLevel),
  );
}
