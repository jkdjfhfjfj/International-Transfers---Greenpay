import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        const variant = props.variant
        return (
          <Toast key={id} {...props}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              variant === "destructive"
                ? "bg-destructive/10 text-destructive"
                : variant === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-primary/10 text-primary"
            }`}>
              {variant === "destructive" ? <AlertCircle className="h-4 w-4" /> : variant === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </span>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
