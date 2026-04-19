import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Readable message from PostgREST / Supabase errors (plain objects may log as `{}` in the console). */
export function getSupabaseErrorMessage(error: unknown): string {
  if (error == null) return "Unknown error"
  if (typeof error === "object") {
    const e = error as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }
    const parts = [e.message, e.details, e.hint].filter((p) => p && String(p).trim())
    if (parts.length) return parts.join(" — ")
  }
  if (error instanceof Error && error.message) return error.message
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}
