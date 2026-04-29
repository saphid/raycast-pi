import {
  Icon,
  MenuBarExtra,
  getPreferenceValues,
  launchCommand,
  LaunchType,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { listPiSessions } from "./lib/discovery";
import { formatRelativeDate } from "./lib/format";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const { data: sessions = [], isLoading } = usePromise(() =>
    listPiSessions(preferences.agentDir, "100"),
  );
  const latest = sessions[0];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = sessions.filter(
    (session) => session.lastModified >= todayStart,
  ).length;

  return (
    <MenuBarExtra
      icon={Icon.Terminal}
      title={todayCount > 0 ? String(todayCount) : undefined}
      isLoading={isLoading}
    >
      {latest ? (
        <>
          <MenuBarExtra.Item
            title={`Latest: ${latest.projectName}`}
            subtitle={formatRelativeDate(latest.lastModified)}
          />
          <MenuBarExtra.Separator />
        </>
      ) : (
        <MenuBarExtra.Item title="No Pi sessions found" />
      )}
      <MenuBarExtra.Item
        title="Browse Sessions"
        icon={Icon.Message}
        onAction={() =>
          launchCommand({ name: "sessions", type: LaunchType.UserInitiated })
        }
      />
      <MenuBarExtra.Item
        title="Launch Project"
        icon={Icon.Terminal}
        onAction={() =>
          launchCommand({ name: "projects", type: LaunchType.UserInitiated })
        }
      />
      <MenuBarExtra.Item
        title="Ask Pi"
        icon={Icon.QuestionMark}
        onAction={() =>
          launchCommand({ name: "ask-pi", type: LaunchType.UserInitiated })
        }
      />
    </MenuBarExtra>
  );
}
