import { toast } from "sonner"

export async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast(message)
    return true
  } catch {
    toast.error("Couldn't copy. Clipboard access was blocked.")
    return false
  }
}
