export const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(
  /\/$/,
  "",
);
export const isDemo = import.meta.env.MODE === "pages";
export function readStored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
export async function request(
  path,
  { token, timeoutMs = 25000, ...options } = {},
) {
  if (isDemo) {
    const { demoRequest } = await import("./demo.js");
    return demoRequest(path, options);
  }
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs),
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      Array.isArray(data.error)
        ? data.error[0]?.message
        : data.error || "No se pudo completar la solicitud.",
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
