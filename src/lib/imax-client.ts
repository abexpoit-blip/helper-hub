// BROWSER-ONLY helpers for talking to a locally-running iMax Anti-detect Browser
// (default endpoint http://127.0.0.1:54345). Calls go directly from the user's
// browser because the cloud server cannot reach 127.0.0.1.

export type ImaxTestResult = {
  ok: boolean;
  message: string;
  latencyMs?: number;
  profileCount?: number;
};

export async function testImaxConnection(endpoint: string, token?: string): Promise<ImaxTestResult> {
  const url = endpoint.replace(/\/+$/, "");
  const started = performance.now();
  try {
    const res = await fetch(`${url}/health`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      // local network — short timeout via AbortSignal
      signal: AbortSignal.timeout(4000),
    }).catch(async () => {
      // fall back to the legacy /browser/list endpoint many iMax builds expose
      return fetch(`${url}/browser/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ page: 0, pageSize: 1 }),
        signal: AbortSignal.timeout(4000),
      });
    });
    const latencyMs = Math.round(performance.now() - started);
    if (!res.ok) {
      return { ok: false, message: `HTTP ${res.status} ${res.statusText}`, latencyMs };
    }
    let profileCount: number | undefined;
    try {
      const j = await res.json();
      profileCount = j?.data?.total ?? j?.total ?? j?.count;
    } catch {
      /* ignore */
    }
    return {
      ok: true,
      message: profileCount != null ? `Connected · ${profileCount} profiles` : "Connected",
      latencyMs,
      profileCount,
    };
  } catch (e) {
    return {
      ok: false,
      message:
        (e as Error).name === "TimeoutError"
          ? "Timeout — iMax not reachable. Is the desktop app running?"
          : `Failed: ${(e as Error).message}`,
    };
  }
}

export async function listImaxProfiles(endpoint: string, token?: string) {
  const url = endpoint.replace(/\/+$/, "");
  const res = await fetch(`${url}/browser/list`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ page: 0, pageSize: 100 }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`iMax list failed: HTTP ${res.status}`);
  const j = await res.json();
  // Try common response shapes
  return (j?.data?.list ?? j?.list ?? j?.data ?? []) as Array<{ id: string; name?: string }>;
}
