import {
  Action,
  ActionPanel,
  getPreferenceValues,
  Icon,
  List,
  open,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { defaultProjectPath, discoverResources } from "./lib/discovery";

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const projectPath = defaultProjectPath(preferences.defaultProject);
  const { data: resources = [], isLoading } = usePromise(() =>
    discoverResources({ agentDir: preferences.agentDir, projectPath }),
  );

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search Pi prompts and skills…"
    >
      <List.EmptyView
        icon={Icon.Hammer}
        title="No Pi resources found"
        description="This command looks for prompts and skills in ~/.pi/agent plus project .pi/.agents folders."
      />
      {resources.map((resource) => (
        <List.Item
          key={resource.filePath}
          icon={resource.type === "skill" ? Icon.Hammer : Icon.Text}
          title={resource.title}
          subtitle={resource.filePath}
          accessories={[{ tag: resource.type }, { text: resource.scope }]}
          actions={
            <ActionPanel>
              <Action
                title="Open Resource"
                icon={Icon.Document}
                onAction={() => open(resource.filePath)}
              />
              <Action.CopyToClipboard
                title="Copy Path"
                content={resource.filePath}
              />
              <Action.ShowInFinder path={resource.filePath} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
