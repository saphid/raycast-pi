import {
  Clipboard,
  getPreferenceValues,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { defaultProjectPath } from "./lib/discovery";
import { runPiPrint } from "./lib/piCli";

type CommandProps = {
  arguments: Arguments.AskPi;
};

export default async function Command(props: CommandProps) {
  const preferences = getPreferenceValues<Preferences>();
  const question = props.arguments.question?.trim();

  if (!question) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Ask Pi needs a question",
      message:
        "Select Ask Pi, press Tab, type your question, then press Enter.",
    });
    return;
  }

  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Asking Pi…",
    message: "The answer will be copied to the clipboard.",
  });

  try {
    const answer = await runPiPrint(question, {
      cwd: defaultProjectPath(preferences.defaultProject),
      preferences,
    });

    await Clipboard.copy(answer);
    toast.style = Toast.Style.Success;
    toast.title = "Pi answer copied";
    toast.message = "Paste it anywhere with ⌘V.";
    await showHUD("Pi answer copied to clipboard");
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Pi failed";
    toast.message = error instanceof Error ? error.message : String(error);
  }
}
