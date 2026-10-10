"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

import { PRODUCT_TOAST_DURATION_MS } from "@/lib/ui/product-toast"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      closeButton
      visibleToasts={3}
      duration={PRODUCT_TOAST_DURATION_MS}
      mobileOffset={{ top: "max(16px, env(safe-area-inset-top))" }}
      offset={{ top: "max(16px, env(safe-area-inset-top))" }}
      icons={{
        success: (
          <CircleCheckIcon aria-hidden className="size-4" />
        ),
        info: (
          <InfoIcon aria-hidden className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon aria-hidden className="size-4" />
        ),
        error: (
          <OctagonXIcon aria-hidden className="size-4" />
        ),
        loading: (
          <Loader2Icon aria-hidden className="size-4 animate-spin" />
        ),
      }}
      toastOptions={{
        duration: PRODUCT_TOAST_DURATION_MS,
        classNames: {
          toast: "cn-toast",
          title: "text-sm font-medium text-foreground",
          description: "text-sm text-muted-foreground",
          actionButton:
            "rounded-full bg-primary px-3 text-xs font-medium text-primary-foreground",
          cancelButton:
            "rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground",
          closeButton:
            "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
