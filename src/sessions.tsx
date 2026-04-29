import {
  Action,
  ActionPanel,
  Detail,
  getPreferenceValues,
  Icon,
  List,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listPiSessions } from "./lib/discovery";
import { formatCost, formatRelativeDate } from "./lib/format";
import { launchPiInTerminal } from "./lib/terminal";
import type { PiSession } from "./lib/sessionParser";

function SessionDetail({ session }: { session: PiSession }) {
  const preferences = getPreferenceValues<Preferences>();
  const metadata = (
    <Detail.Metadata>
      <Detail.Metadata.Label title="Project" text={session.projectPath} />
      <Detail.Metadata.Label
        title="Updated"
        text={session.lastModified.toLocaleString()}
      />
      {session.model ? (
        <Detail.Metadata.Label title="Model" text={session.model} />
      ) : null}
      {session.provider ? (
        <Detail.Metadata.Label title="Provider" text={session.provider} />
      ) : null}
      {session.thinkingLevel ? (
        <Detail.Metadata.Label title="Thinking" text={session.thinkingLevel} />
      ) : null}
      <Detail.Metadata.Label title="Turns" text={String(session.turnCount)} />
      {session.totalTokens ? (
        <Detail.Metadata.Label
          title="Tokens"
          text={String(session.totalTokens)}
        />
      ) : null}
      {formatCost(session.cost) ? (
        <Detail.Metadata.Label title="Cost" text={formatCost(session.cost)} />
      ) : null}
      <Detail.Metadata.Separator />
      <Detail.Metadata.Label title="File" text={session.filePath} />
    </Detail.Metadata>
  );

  return (
    <Detail
      markdown={`# ${session.displayTitle}\n\n${session.preview}`}
      metadata={metadata}
      actions={
        <ActionPanel>
          <Action
            title="Resume Session in Pi"
            icon={Icon.Terminal}
            onAction={() =>
              launchPiInTerminal({
                cwd: session.projectPath,
                sessionFile: session.filePath,
                terminalApp: preferences.terminalApp,
                preferences,
              })
            }
          />
          <Action
            title="Fork Session in Pi"
            icon={Icon.ArrowClockwise}
            onAction={() =>
              launchPiInTerminal({
                cwd: session.projectPath,
                forkSessionFile: session.filePath,
                terminalApp: preferences.terminalApp,
                preferences,
              })
            }
          />
          <Action.CopyToClipboard
            title="Copy Session Path"
            content={session.filePath}
          />
          <Action.Open
            title="Open Project Folder"
            target={session.projectPath}
            icon={Icon.Folder}
          />
        </ActionPanel>
      }
    />
  );
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data: sessions = [], isLoading } = usePromise(() =>
    listPiSessions(preferences.agentDir, preferences.maxIndexedSessions),
  );

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search Pi sessions…">
      <List.EmptyView
        icon={Icon.Message}
        title="No Pi sessions found"
        description="Pi sessions are read from ~/.pi/agent/sessions by default. Start a Pi conversation or update the Pi Agent Directory preference."
        actions={
          <ActionPanel>
            <Action.OpenInBrowser title="Open Pi Docs" url="https://pi.dev" />
          </ActionPanel>
        }
      />
      {sessions.map((session) => (
        <List.Item
          key={session.filePath}
          icon={Icon.Message}
          title={session.displayTitle}
          subtitle={session.projectName}
          accessories={[
            { text: session.model },
            { text: formatRelativeDate(session.lastModified) },
          ]}
          actions={
            <ActionPanel>
              <Action.Push
                title="Preview Session"
                icon={Icon.Sidebar}
                target={<SessionDetail session={session} />}
              />
              <Action
                title="Resume Session in Pi"
                icon={Icon.Terminal}
                onAction={() =>
                  launchPiInTerminal({
                    cwd: session.projectPath,
                    sessionFile: session.filePath,
                    terminalApp: preferences.terminalApp,
                    preferences,
                  })
                }
              />
              <Action
                title="Fork Session in Pi"
                icon={Icon.ArrowClockwise}
                onAction={() =>
                  launchPiInTerminal({
                    cwd: session.projectPath,
                    forkSessionFile: session.filePath,
                    terminalApp: preferences.terminalApp,
                    preferences,
                  })
                }
              />
              <Action.CopyToClipboard
                title="Copy Session Path"
                content={session.filePath}
              />
              <Action.Open
                title="Open Project Folder"
                target={session.projectPath}
                icon={Icon.Folder}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
