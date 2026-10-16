import type { ReactNode } from "react";

type AuthScreenVariant = "narrow" | "reading";

type AuthScreenProps = {
  variant: AuthScreenVariant;
  children: ReactNode;
};

export const AuthScreen = ({ variant, children }: AuthScreenProps) => {
  if (variant === "narrow") {
    return (
      <div className="grid min-h-dvh place-items-center px-4 py-10">
        <main className="w-full max-w-sm">{children}</main>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-10">{children}</main>
  );
};
