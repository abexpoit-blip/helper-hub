// BROWSER-ONLY helpers for talking to a locally-running iMax Anti-detect Browser
// (default endpoint http://127.0.0.1:54345). Calls go directly from the user's
// browser because the cloud server cannot reach 127.0.0.1.

export type DiagStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "ok" | "fail" | "warn";
  detail?: string;
  hint?: string;
  ms?: number;
};

export type ImaxTestResult = {
  ok: boolean;
  message: string;
  latencyMs?: number;
  profileCount?: number;
  steps: DiagStep[];
};

function friendlyError(e: unknown, url: string): { message: string; hint: string } {
  const err = e as Error & { name?: string };
  const name = err?.name ?? "";
  const msg = String(err?.message ?? e);
  if (name === "TimeoutError" || /timeout/i.test(msg)) {
    return {
      message: "Timeout — no response from iMax desktop app.",
      hint: "iMax Anti-detect Browser ডেস্কটপ অ্যাপ চালু আছে কিনা দেখুন এবং Settings → Local API enabled আছে কিনা যাচাই করুন।",
    };
  }
  if (/Failed to fetch|NetworkError|TypeError/i.test(msg)) {
    if (url.startsWith("http://") && location.protocol === "https:") {
      return {
        message: "Mixed-content blocked — HTTPS পেজ থেকে HTTP লোকাল API কল করা যাচ্ছে না।",
        hint: "ব্রাউজারে এই সাইটের জন্য 'Insecure content' allow করুন, অথবা ডেস্কটপ ক্লায়েন্ট থেকে কল করুন।",
      };
    }
    return {
      message: "Connection refused — iMax পোর্ট খোলা নেই।",
      hint: "iMax চালু আছে কিনা দেখুন; firewall/antivirus ব্লক করছে কিনা চেক করুন; পোর্ট 54345 (বা আপনার কাস্টম পোর্ট) ফ্রি থাকতে হবে।",
    };
  }
  if (/CORS/i.test(msg)) {
    return {
      message: "CORS রিজেক্ট করেছে iMax।",
      hint: "iMax → Settings এ Allow CORS / API origin '*' enable করুন এবং অ্যাপ রিস্টার্ট করুন।",
    };
  }
  return { message: msg || "Unknown error", hint: "Endpoint URL আবার চেক করুন।" };
}

async function timed<T>(fn: () => Promise<T>): Promise<{ value?: T; error?: unknown; ms: number }> {
  const t = performance.now();
  try {
    const value = await fn();
    return { value, ms: Math.round(performance.now() - t) };
  } catch (error) {
    return { error, ms: Math.round(performance.now() - t) };
  }
}

export async function testImaxConnection(
  endpoint: string,
  token: string | undefined,
  onProgress?: (steps: DiagStep[]) => void
): Promise<ImaxTestResult> {
  const url = endpoint.replace(/\/+$/, "");
  const steps: DiagStep[] = [
    { id: "url", label: "Validate endpoint URL", status: "pending" },
    { id: "reach", label: "Reach iMax local server", status: "pending" },
    { id: "auth", label: "Authenticate (Bearer token)", status: "pending" },
    { id: "list", label: "Fetch profile list", status: "pending" },
    { id: "fp", label: "Verify footprint API", status: "pending" },
  ];
  const emit = () => onProgress?.([...steps]);

  // Step 1: URL
  steps[0].status = "running"; emit();
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) throw new Error("Protocol must be http(s)");
    steps[0].status = "ok";
    steps[0].detail = `${u.protocol}//${u.host}`;
    if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") {
      steps[0].status = "warn";
      steps[0].hint = "iMax সাধারণত শুধু localhost-এ চলে — remote IP দিলে desktop client বা SSH tunnel দরকার।";
    }
  } catch {
    steps[0].status = "fail";
    steps[0].detail = "Invalid URL";
    steps[0].hint = "উদাহরণ: http://127.0.0.1:54345";
    emit();
    return { ok: false, message: "Invalid endpoint URL", steps };
  }
  emit();

  // Step 2: reach /health
  steps[1].status = "running"; emit();
  const ping = await timed(() =>
    fetch(`${url}/health`, { signal: AbortSignal.timeout(4000) })
  );
  if (ping.error || !ping.value) {
    // Try fallback root
    const root = await timed(() =>
      fetch(`${url}/`, { signal: AbortSignal.timeout(3000) })
    );
    if (root.error || !root.value) {
      const fe = friendlyError(ping.error ?? root.error, url);
      steps[1].status = "fail";
      steps[1].detail = fe.message;
      steps[1].hint = fe.hint;
      steps[1].ms = ping.ms;
      emit();
      return { ok: false, message: fe.message, latencyMs: ping.ms, steps };
    }
    steps[1].status = "warn";
    steps[1].detail = `/health missing, root responded (${root.value.status})`;
    steps[1].ms = root.ms;
  } else {
    steps[1].status = ping.value.ok ? "ok" : "warn";
    steps[1].detail = `HTTP ${ping.value.status}`;
    steps[1].ms = ping.ms;
  }
  emit();

  // Step 3: auth
  steps[2].status = "running"; emit();
  const authRes = await timed(() =>
    fetch(`${url}/browser/list`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ page: 0, pageSize: 1 }),
      signal: AbortSignal.timeout(5000),
    })
  );
  if (authRes.error || !authRes.value) {
    const fe = friendlyError(authRes.error, url);
    steps[2].status = "fail";
    steps[2].detail = fe.message;
    steps[2].hint = fe.hint;
    steps[2].ms = authRes.ms;
    emit();
    return { ok: false, message: fe.message, latencyMs: authRes.ms, steps };
  }
  if (authRes.value.status === 401 || authRes.value.status === 403) {
    steps[2].status = "fail";
    steps[2].detail = `HTTP ${authRes.value.status} — token rejected`;
    steps[2].hint = "iMax Settings → API token কপি করে এখানে paste করুন; পুরোনো token হলে regenerate করুন।";
    emit();
    return { ok: false, message: "Authentication failed", latencyMs: authRes.ms, steps };
  }
  steps[2].status = "ok";
  steps[2].detail = token ? "Bearer accepted" : "No token required";
  steps[2].ms = authRes.ms;
  emit();

  // Step 4: list profiles
  steps[3].status = "running"; emit();
  let profileCount: number | undefined;
  try {
    const j = await authRes.value.clone().json();
    profileCount = j?.data?.total ?? j?.total ?? j?.count ?? (Array.isArray(j?.data?.list) ? j.data.list.length : undefined);
    if (profileCount == null) {
      steps[3].status = "warn";
      steps[3].detail = "Response received but profile count missing — iMax বিল্ড পুরোনো হতে পারে।";
      steps[3].hint = "iMax আপডেট করুন (v2.4+)।";
    } else {
      steps[3].status = profileCount > 0 ? "ok" : "warn";
      steps[3].detail = `${profileCount} profile(s) found`;
      if (profileCount === 0) steps[3].hint = "iMax-এ কোনো browser profile নেই — অন্তত একটা তৈরি করুন।";
    }
  } catch {
    steps[3].status = "warn";
    steps[3].detail = "Non-JSON response";
    steps[3].hint = "এটা সম্ভবত iMax নয় — অন্য কোনো সার্ভিস পোর্ট দখল করে আছে।";
  }
  emit();

  // Step 5: footprint API (best-effort)
  steps[4].status = "running"; emit();
  const fpRes = await timed(() =>
    fetch(`${url}/api/v1/browser/fingerprint/random`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(4000),
    })
  );
  if (fpRes.error || !fpRes.value) {
    steps[4].status = "warn";
    steps[4].detail = "Footprint endpoint not reachable";
    steps[4].hint = "Optional — শুধু randomization-এর জন্য দরকার।";
  } else if (!fpRes.value.ok) {
    steps[4].status = "warn";
    steps[4].detail = `HTTP ${fpRes.value.status}`;
  } else {
    steps[4].status = "ok";
    steps[4].detail = "Randomizer reachable";
    steps[4].ms = fpRes.ms;
  }
  emit();

  const fatal = steps.some((s) => s.status === "fail");
  return {
    ok: !fatal,
    message: fatal ? "Connection failed" : profileCount != null ? `Connected · ${profileCount} profiles` : "Connected",
    latencyMs: ping.ms,
    profileCount,
    steps,
  };
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
  return (j?.data?.list ?? j?.list ?? j?.data ?? []) as Array<{ id: string; name?: string }>;
}
