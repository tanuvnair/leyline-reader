import { cn } from "cn"

function Skeleton({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "circle" | "pill"
}) {
  return (
    <div
      data-slot="skeleton"
      data-variant={variant}
      className={cn(
        "size-full animate-pulse bg-muted",
        variant === "default" && "rounded-md",
        variant === "circle" && "rounded-full",
        variant === "pill" && "rounded-4xl",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
