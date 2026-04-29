import {
  Action,
  ActionPanel,
  Clipboard,
  Detail,
  getPreferenceValues,
  getSelectedText,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { defaultProjectPath } from "./lib/discovery";
import { runPiPrint } from "./lib/piCli";
import {
  buildTransformPrompt,
  TRANSFORMS,
  type TransformId,
} from "./lib/transforms";

type ResultProps = {
  transformId: TransformId;
  selectedText: string;
};

function TransformResult({ transformId, selectedText }: ResultProps) {
  const preferences = getPreferenceValues<Preferences>();
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const prompt = buildTransformPrompt(transformId, selectedText);
    runPiPrint(prompt, {
      cwd: defaultProjectPath(preferences.defaultProject),
      preferences,
      onData: (chunk) => {
        if (!cancelled) setResult((current) => current + chunk);
      },
    })
      .then((output) => {
        if (!cancelled) setResult(output);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [preferences, selectedText, transformId]);

  const markdown = error
    ? `# Pi failed\n\n\`\`\`\n${error}\n\`\`\``
    : result || "Waiting for Pi…";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Result"
            content={result || error || ""}
          />
          <Action.Paste title="Paste Result" content={result} />
        </ActionPanel>
      }
    />
  );
}

async function readSelectedOrClipboardText(): Promise<string> {
  try {
    return await getSelectedText();
  } catch {
    const clipboardText = await Clipboard.readText();
    return clipboardText ?? "";
  }
}

export default function Command() {
  const [selectedText, setSelectedText] = useState<string>("");
  const { push } = useNavigation();

  useEffect(() => {
    readSelectedOrClipboardText().then(setSelectedText);
  }, []);

  return (
    <List searchBarPlaceholder="Choose a Pi transform…">
      {TRANSFORMS.map((transform) => (
        <List.Item
          key={transform.id}
          icon={Icon.Wand}
          title={transform.title}
          subtitle={transform.subtitle}
          actions={
            <ActionPanel>
              <Action
                title="Run Transform"
                icon={Icon.Wand}
                onAction={async () => {
                  if (!selectedText.trim()) {
                    await showToast({
                      style: Toast.Style.Failure,
                      title: "No selected or clipboard text found",
                    });
                    return;
                  }
                  push(
                    <TransformResult
                      transformId={transform.id}
                      selectedText={selectedText}
                    />,
                  );
                }}
              />
              <Action.CopyToClipboard
                title="Copy Prompt"
                content={buildTransformPrompt(transform.id, selectedText)}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
