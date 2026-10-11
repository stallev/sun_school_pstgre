import { Inbox } from "lucide-react";
import { StateMessage, type StateMessageProps } from "./StateMessage";

export const EmptyState = (props: StateMessageProps) => (
  <StateMessage icon={Inbox} {...props} />
);
