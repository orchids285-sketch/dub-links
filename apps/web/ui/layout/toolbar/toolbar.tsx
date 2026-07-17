import { HelpButton } from "../sidebar/help-button";
import { OnboardingButton } from "./onboarding/onboarding-button";

const toolbarItems = ["onboarding", "help"] as const;

type ToolbarProps = {
  show?: (typeof toolbarItems)[number][];
};

export default function Toolbar(_props: ToolbarProps) {
  // De-branded self-host: no Dub onboarding ("Complete setup") or support/help widgets.
  return null;
}
