import { TriangleAlert } from "lucide-react";
import { StateMessage, type StateMessageProps } from "./StateMessage";

export const ErrorState = (props: StateMessageProps) => (
  <div role="alert">
    <StateMessage icon={TriangleAlert} {...props} />
  </div>
);
