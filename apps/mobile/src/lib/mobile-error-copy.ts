import { MobileApiError } from "@/src/lib/api-client";

type ErrorCopy = {
  title: string;
  message: string;
};

const DEFAULT_COPY: ErrorCopy = {
  title: "Something went wrong",
  message: "Try again in a moment."
};

export function getMobileErrorCode(error: unknown) {
  if (error instanceof MobileApiError) return error.code;
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return undefined;
}

export function getMobileErrorCopy(
  error: unknown,
  fallback: Partial<ErrorCopy> = {}
): ErrorCopy {
  const code = getMobileErrorCode(error);

  if (code === "invalid_media_url") {
    return {
      title: "External media only",
      message: "Posts currently support external http(s) media URLs only. Native media uploads are not available in mobile yet."
    };
  }

  if (code === "unauthorized") {
    return {
      title: "Sign in again",
      message: "Your session expired for this action. Sign in again, then retry."
    };
  }

  if (code === "forbidden") {
    return {
      title: "Action unavailable",
      message: "This action is not available for the current account."
    };
  }

  if (code === "provider_misconfigured") {
    return {
      title: "Service not configured",
      message: "This environment is missing a required provider configuration. Retry in a configured environment."
    };
  }

  if (code === "provider_unavailable") {
    return {
      title: "Service temporarily unavailable",
      message: "That provider is unavailable right now. Try again in a moment, or use mock mode locally if it is enabled."
    };
  }

  if (code === "rate_limited") {
    return {
      title: "Please wait a moment",
      message: "That action is being rate limited right now. Give it a minute, then retry."
    };
  }

  if (code === "invalid_input" || code === "invalid_request") {
    return {
      title: "Check the request",
      message: "Review the input for this step and try again."
    };
  }

  if (code === "trip_not_found") {
    return {
      title: "Trip unavailable",
      message: "We couldn't find this trip for the requested action anymore."
    };
  }

  if (code === "destination_unresolved" || code === "place_unresolved" || code === "missing_place" || code === "unresolved_places") {
    return {
      title: "Location needs review",
      message: "One or more places could not be verified. Re-run parsing or use the standard generator."
    };
  }

  if (code === "model_timeout" || code === "model_error" || code === "policy_invalid" || code === "degraded_fallback") {
    return {
      title: "Fallback used",
      message: "The AI draft could not be used cleanly, so Pave switched to a safer fallback."
    };
  }

  return {
    title: fallback.title || DEFAULT_COPY.title,
    message:
      fallback.message ||
      (error instanceof Error && error.message ? error.message : DEFAULT_COPY.message)
  };
}
