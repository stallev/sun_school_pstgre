import { ContentText } from "@/components/atoms";
import type { AuthMessages } from "@/lib/messages/auth-messages";

type ProfileDeletionStubProps = {
  messages: AuthMessages["profile"];
};

export const ProfileDeletionStub = ({ messages }: ProfileDeletionStubProps) => (
  <ContentText tone="muted">{messages.deletionStub}</ContentText>
);
