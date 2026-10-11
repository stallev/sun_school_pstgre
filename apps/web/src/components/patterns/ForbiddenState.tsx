import { Lock } from "lucide-react";
import { StateMessage, type StateMessageProps } from "./StateMessage";

export const ForbiddenState = (props: StateMessageProps) => (
  <StateMessage icon={Lock} {...props} />
);
