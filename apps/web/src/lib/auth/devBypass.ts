const LOCAL_DEV_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export function isClientDevAuthBypassEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_AUTH_BYPASS === "true" &&
    LOCAL_DEV_HOSTNAMES.has(window.location.hostname)
  );
}