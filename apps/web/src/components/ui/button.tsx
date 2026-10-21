import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent text-[0.9375rem] font-medium whitespace-nowrap transition-[background-color,transform] duration-150 ease-out-soft outline-none select-none active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:pointer-events-none disabled:opacity-45 aria-busy:pointer-events-none aria-busy:opacity-70 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-cobalt-ink text-surface hover:bg-cobalt-deep",
        outline:
          "border-line-strong bg-surface text-ink hover:bg-paper aria-expanded:bg-paper",
        secondary: "bg-cobalt-soft text-cobalt-ink hover:bg-cobalt-soft/70",
        ghost: "text-ink hover:bg-line/60 aria-expanded:bg-line/60",
        destructive:
          "border-danger/60 bg-surface text-danger hover:bg-danger-soft",
        "destructive-solid": "bg-danger text-surface hover:bg-danger/90",
        link: "text-cobalt-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        /** Topnav / compact chrome — prototype `h-9` + `text-[0.9375rem]` (UX-03 §8), not `text-sm`. */
        nav: "h-9 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-5",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  nativeButton,
  render,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      // Base UI defaults nativeButton to true and warns when `render` is not a <button>.
      // Product navigation uses CustomLink (<a>). Pass nativeButton when render is a real <button>.
      nativeButton={nativeButton ?? render == null}
      render={render}
      {...props}
    />
  )
}

export { Button, buttonVariants }
