export type FriendlyErrorInfo = {
  title: string
  description: string
  isNetworkError: boolean
  isRetryable: boolean
  actionText?: string
  badgeText?: string
}

/**
 * Transforms cryptic system / fetch / database error messages into 
 * clear, actionable, user-friendly error details.
 */
export function formatFriendlyError(error: any): FriendlyErrorInfo {
  const isOffline = typeof window !== "undefined" && typeof navigator !== "undefined" && !navigator.onLine

  if (isOffline) {
    return {
      title: "No Internet Connection",
      description: "Your device is currently offline. Please reconnect to Wi-Fi or mobile data and tap Retry.",
      isNetworkError: true,
      isRetryable: true,
      badgeText: "Offline",
      actionText: "Retry Submission"
    }
  }

  const rawMessage = (error?.message || (typeof error === "string" ? error : "")) + ""
  const lower = rawMessage.toLowerCase()

  // 1. Fetch / Network drops
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network request failed") ||
    lower.includes("load failed") ||
    lower.includes("network_error") ||
    lower.includes("aborted") ||
    error?.name === "TypeError"
  ) {
    return {
      title: "Connection Lost During Submission",
      description: "Unable to reach the server. This happens when mobile connection switches or drops temporarily. Your order items and pricing are safely preserved.",
      isNetworkError: true,
      isRetryable: true,
      badgeText: "Network Glitch",
      actionText: "Retry Submission"
    }
  }

  // 2. Gateway / Server Timeouts
  if (
    lower.includes("timeout") ||
    lower.includes("504") ||
    lower.includes("gateway") ||
    lower.includes("expired") ||
    lower.includes("connection pool")
  ) {
    return {
      title: "Server Processing Timed Out",
      description: "The database took longer than usual to allocate the invoice sequence or update inventory. Tap retry to verify and complete.",
      isNetworkError: true,
      isRetryable: true,
      badgeText: "Timeout",
      actionText: "Retry Submission"
    }
  }

  // 3. Price policy override required
  if (lower.includes("price override") || lower.includes("policy limits")) {
    return {
      title: "Pricing Policy Approval Required",
      description: rawMessage.replace(/^Error:\s*/, ""),
      isNetworkError: false,
      isRetryable: false,
      badgeText: "Price Policy",
      actionText: "Review Pricing"
    }
  }

  // 4. Missing customer
  if (lower.includes("customer not found") || lower.includes("missing customer")) {
    return {
      title: "Customer Record Not Found",
      description: "The selected customer record could not be found. Please step back to select or create the customer.",
      isNetworkError: false,
      isRetryable: false,
      badgeText: "Customer",
      actionText: "Select Customer"
    }
  }

  // 5. Item validation
  if (lower.includes("missing items") || lower.includes("positive revenue") || lower.includes("invalid quantity")) {
    return {
      title: "Invalid Order Items",
      description: "Your order must contain at least one valid item with positive quantity and revenue.",
      isNetworkError: false,
      isRetryable: false,
      badgeText: "Validation",
      actionText: "Edit Products"
    }
  }

  // 6. Generic or redacted server error
  if (lower.includes("server components render") || !rawMessage) {
    return {
      title: "Order Submission Delayed",
      description: "The server experienced a temporary glitch while saving your order. All your items are preserved. Tap below to retry.",
      isNetworkError: false,
      isRetryable: true,
      badgeText: "Server Busy",
      actionText: "Try Again"
    }
  }

  return {
    title: "Order Submission Failed",
    description: rawMessage.replace(/^Error:\s*/, ""),
    isNetworkError: false,
    isRetryable: true,
    badgeText: "Error",
    actionText: "Try Again"
  }
}
