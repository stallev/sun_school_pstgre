"use client";

import { Suspense } from "react";

import {
  LoginCredentialsProvider,
  useLoginCredentials,
} from "@/components/auth/LoginCredentialsProvider.client";
import { LoginDemoSection } from "@/components/auth/LoginDemoSection.client";
import { LoginForm } from "@/components/auth/LoginForm.client";

type LoginPageFlowInnerProps = {
  callbackUrl?: string;
  loadDemoPanel: boolean;
  children?: React.ReactNode;
};

function LoginPageFlowInner({
  callbackUrl,
  loadDemoPanel,
  children,
}: LoginPageFlowInnerProps) {
  const { demoRole, credentials } = useLoginCredentials();

  return (
    <div className="space-y-0">
      <LoginForm
        key={demoRole ?? "manual"}
        callbackUrl={callbackUrl}
        initialEmail={credentials?.email}
        initialPassword={credentials?.password}
      />
      {children}
      {loadDemoPanel ? (
        <Suspense fallback={null}>
          <LoginDemoSection />
        </Suspense>
      ) : null}
    </div>
  );
}

export type LoginPageFlowProps = LoginPageFlowInnerProps;

export function LoginPageFlow({
  callbackUrl,
  loadDemoPanel,
  children,
}: LoginPageFlowProps) {
  return (
    <LoginCredentialsProvider>
      <LoginPageFlowInner
        callbackUrl={callbackUrl}
        loadDemoPanel={loadDemoPanel}
      >
        {children}
      </LoginPageFlowInner>
    </LoginCredentialsProvider>
  );
}
