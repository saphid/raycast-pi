import {
  Action,
  ActionPanel,
  Detail,
  getPreferenceValues,
  Icon,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { defaultProjectPath } from "./lib/discovery";
import { runPiPrint } from "./lib/piCli";
import { launchPiInTerminal } from "./lib/terminal";

type CommandProps = {
  arguments: Arguments.AskPi;
};

function AnswerView({ question, cwd }: { question: string; cwd: string }) {
  const preferences = getPreferenceValues<Preferences>();
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setAnswer("");
    setError(undefined);
    setIsLoading(true);

    runPiPrint(question, {
      cwd,
      preferences,
      onData: (chunk) => {
        if (!cancelled) setAnswer((current) => current + chunk);
      },
    })
      .then((result) => {
        if (!cancelled) setAnswer(result);
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
  }, [cwd, question]);

  const markdown = error
    ? `# Pi failed\n\n\`\`\`\n${error}\n\`\`\``
    : answer || "Waiting for Pi…";

  return (
    <Detail
      isLoading={isLoading}
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard
            title="Copy Answer"
            content={answer || error || ""}
          />
          <Action
            title="Continue in Terminal"
            icon={Icon.Terminal}
            onAction={() =>
              launchPiInTerminal({
                cwd,
                prompt: question,
                terminalApp: preferences.terminalApp,
                preferences,
              })
            }
          />
        </ActionPanel>
      }
    />
  );
}

export default function Command(props: CommandProps) {
  const preferences = getPreferenceValues<Preferences>();
  const question = props.arguments.question.trim();
  const cwd = defaultProjectPath(preferences.defaultProject);

  return <AnswerView question={question} cwd={cwd} />;
}
