import type { ReactNode } from "react";

type AuthGroupLayoutProps = {
  children: ReactNode;
};

/** Centered auth screens without app chrome (global_shell_spec §4). */
const AuthGroupLayout = ({ children }: AuthGroupLayoutProps) => (
  <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 py-8">
    <div className="w-full max-w-md">{children}</div>
  </div>
);

export default AuthGroupLayout;
