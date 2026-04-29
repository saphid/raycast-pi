import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
  open,
  showToast,
  Toast,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listPiProjects } from "./lib/discovery";
import { formatRelativeDate } from "./lib/format";
import { launchPiInTerminal } from "./lib/terminal";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const {
    data: projects = [],
    isLoading,
    revalidate,
  } = usePromise(() =>
    listPiProjects(preferences.agentDir, preferences.maxIndexedSessions),
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search Pi projects…">
      <List.EmptyView
        icon={Icon.Terminal}
        title="No Pi projects found"
        description="Run Pi in a project first, or set Pi Agent Directory to the folder that contains your sessions."
        actions={
          <ActionPanel>
            <Action.OpenInBrowser
              title="Open Pi Install Docs"
              url="https://pi.dev"
            />
            <Action
              title="Refresh"
              icon={Icon.ArrowClockwise}
              onAction={revalidate}
            />
          </ActionPanel>
        }
      />
      {projects.map((project) => (
        <List.Item
          key={project.projectPath}
          icon={Icon.Terminal}
          title={project.projectName}
          subtitle={project.projectPath}
          accessories={[
            { text: `${project.sessionCount} sessions` },
            { text: formatRelativeDate(project.latestSession.lastModified) },
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Open New Pi Session"
                icon={Icon.Terminal}
                onAction={async () => {
                  await launchPiInTerminal({
                    cwd: project.projectPath,
                    terminalApp: preferences.terminalApp,
                    preferences,
                  });
                }}
              />
              <Action
                title="Continue Latest Session"
                icon={Icon.Clock}
                onAction={async () => {
                  await launchPiInTerminal({
                    cwd: project.projectPath,
                    sessionFile: project.latestSession.filePath,
                    terminalApp: preferences.terminalApp,
                    preferences,
                  });
                }}
              />
              <Action.Open
                title="Open Project Folder"
                target={project.projectPath}
                icon={Icon.Folder}
              />
              <Action.CopyToClipboard
                title="Copy Project Path"
                content={project.projectPath}
              />
              <Action
                title="Refresh"
                icon={Icon.ArrowClockwise}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
                onAction={() => {
                  revalidate();
                  showToast({
                    style: Toast.Style.Success,
                    title: "Refreshed Pi projects",
                  });
                }}
              />
              <Action
                title="Reveal Latest Session File"
                icon={Icon.Document}
                onAction={() => open(project.latestSession.filePath)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
