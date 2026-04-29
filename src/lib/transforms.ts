export type TransformId =
  | "explain"
  | "find-bugs"
  | "write-tests"
  | "refactor"
  | "typescript"
  | "improve-writing";

export type TransformDefinition = {
  id: TransformId;
  title: string;
  subtitle: string;
  instruction: string;
};

export const TRANSFORMS: TransformDefinition[] = [
  {
    id: "explain",
    title: "Explain Code or Text",
    subtitle: "Summarize the selected material clearly",
    instruction:
      "Explain the selected code or text clearly. Call out important behavior, assumptions, and risks.",
  },
  {
    id: "find-bugs",
    title: "Find Bugs",
    subtitle: "Review for correctness issues",
    instruction:
      "Find bugs, edge cases, and correctness risks. Prioritize actionable findings and include suggested fixes.",
  },
  {
    id: "write-tests",
    title: "Write Tests",
    subtitle: "Suggest behavior-focused tests",
    instruction:
      "Write behavior-focused tests for the selected code. Prefer public interfaces and avoid implementation-coupled assertions.",
  },
  {
    id: "refactor",
    title: "Refactor",
    subtitle: "Propose a simpler implementation",
    instruction:
      "Refactor the selected code for clarity and maintainability. Return the improved code and briefly explain the change.",
  },
  {
    id: "typescript",
    title: "Convert to TypeScript",
    subtitle: "Add useful types",
    instruction:
      "Convert the selected code to TypeScript with practical types. Keep behavior unchanged.",
  },
  {
    id: "improve-writing",
    title: "Improve Writing",
    subtitle: "Tighten prose while preserving meaning",
    instruction:
      "Improve the selected writing for clarity, brevity, and tone. Preserve the original meaning.",
  },
];

export function getTransform(id: TransformId): TransformDefinition {
  const transform = TRANSFORMS.find((candidate) => candidate.id === id);
  if (!transform) throw new Error(`Unknown transform: ${id}`);
  return transform;
}

export function buildTransformPrompt(
  id: TransformId,
  selectedText: string,
): string {
  const transform = getTransform(id);
  return `${transform.instruction}\n\nDo not edit files. Return only the transformed output or review notes needed by the user.\n\nSelected material:\n\n\`\`\`\n${selectedText}\n\`\`\``;
}
