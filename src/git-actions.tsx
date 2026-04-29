import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listPiProjects } from "./lib/discovery";
import { launchPiInTerminal } from "./lib/terminal";

const GIT_ACTIONS = [
  {
    id: "review-unstaged",
    title: "Review Unstaged Changes",
    prompt:
      "Review the unstaged git changes in this repository. Focus on correctness, tests, and simpler alternatives. Do not edit files unless I explicitly ask in the terminal.",
  },
  {
    id: "review-staged",
    title: "Review Staged Changes",
    prompt:
      "Review the staged git changes in this repository. Focus on blockers, risky assumptions, and missing tests. Do not edit files unless I explicitly ask in the terminal.",
  },
  {
    id: "commit-message",
    title: "Draft Commit Message",
    prompt:
      "Inspect the staged git changes and draft a concise commit message. Do not commit; just propose the message.",
  },
  {
    id: "pr-description",
    title: "Draft PR Description",
    prompt:
      "Inspect the current branch diff from the default branch and draft a PR description with summary, validation, and risks. Do not edit files.",
  },
  {
    id: "test-failure",
    title: "Investigate Test Failure",
    prompt:
      "Investigate the latest test failure in this repository. Start by finding the relevant test command and failure output if available, then propose the smallest fix.",
  },
];

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data: projects = [], isLoading } = usePromise(() =>
    listPiProjects(preferences.agentDir),
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search projects for Git actions…"
    >
      {projects.map((project) => (
        <List.Section
          key={project.projectPath}
          title={project.projectName}
          subtitle={project.projectPath}
        >
          {GIT_ACTIONS.map((gitAction) => (
            <List.Item
              key={`${project.projectPath}-${gitAction.id}`}
              icon={Icon.Code}
              title={gitAction.title}
              subtitle={project.projectPath}
              actions={
                <ActionPanel>
                  <Action
                    title="Launch in Pi Terminal"
                    icon={Icon.Terminal}
                    onAction={() =>
                      launchPiInTerminal({
                        cwd: project.projectPath,
                        prompt: gitAction.prompt,
                        terminalApp: preferences.terminalApp,
                        preferences,
                      })
                    }
                  />
                  <Action.CopyToClipboard
                    title="Copy Prompt"
                    content={gitAction.prompt}
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}
    </List>
  );
}
