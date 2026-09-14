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
        const message = `${title || ""} ${description || ""}`
        const inferredVariant =
          /error|failed|failure|unable|insufficient|invalid|required|declined|cancelled|blocked|expired|suspended|denied|could not|not found/i.test(message)
            ? "destructive"
            : /success|successful|complete|completed|saved|updated|sent|approved|activated|restored|welcome|logged in|processed|created|added|confirmed/i.test(message)
              ? "success"
              : props.variant || "default"
        return (
          <Toast key={id} {...props} variant={inferredVariant as "default" | "destructive" | "success"}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              inferredVariant === "destructive"
                ? "bg-destructive/10 text-destructive"
                : inferredVariant === "success"
                  ? "bg-primary/10 text-primary"
                  : "bg-primary/10 text-primary"
            }`}>
              {inferredVariant === "destructive" ? <AlertCircle className="h-4 w-4" /> : inferredVariant === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
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
