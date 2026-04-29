import {
  Action,
  ActionPanel,
  Detail,
  Form,
  getPreferenceValues,
  Icon,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { defaultProjectPath } from "./lib/discovery";
import { runPiPrint } from "./lib/piCli";
import { launchPiInTerminal } from "./lib/terminal";

type CommandProps = {
  arguments: Arguments.AskPiDetail;
};

type FormValues = {
  question: string;
  cwd: string;
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
  const { push } = useNavigation();
  const initialQuestion = props.arguments.question ?? "";

  async function submit(values: FormValues) {
    if (!values.question.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Enter a question for Pi",
      });
      return;
    }

    push(
      <AnswerView
        question={values.question.trim()}
        cwd={defaultProjectPath(values.cwd)}
      />,
    );
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Ask Pi"
            icon={Icon.Terminal}
            onSubmit={submit}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea
        id="question"
        title="Question"
        placeholder="Ask Pi…"
        defaultValue={initialQuestion}
      />
      <Form.TextField
        id="cwd"
        title="Project Directory"
        defaultValue={defaultProjectPath(preferences.defaultProject)}
      />
      <Form.Description text="Quick Ask runs `pi -p` from Raycast. Use Continue in Terminal for visible agentic work." />
    </Form>
  );
}
