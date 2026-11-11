import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "نبض المشافي - إدارة المستشفيات" },
      { name: "description", content: "تطبيق لإدارة ومتابعة المستشفيات بالمؤشرات الحيوية والصندوق والموظفين." },
      { property: "og:title", content: "نبض المشافي - إدارة المستشفيات" },
      { property: "og:description", content: "متابعة الإيرادات والعمليات والأسرة والموظفين والمصروفات لحظياً." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

async function loadLive() {
  const { data: hs } = await supabase.from("hospitals").select("id, code, name, last_sync_at").order("code");
  const out: Record<string, unknown>[] = [];
  for (const h of hs ?? []) {
    const [v, c] = await Promise.all([
      supabase.from("hospital_vitals").select("*").eq("hospital_id", h.id).order("day", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("cashbox_records").select("*").eq("hospital_id", h.id).order("day", { ascending: false }).limit(1).maybeSingle(),
    ]);
    out.push({ code: h.code, last_sync_at: h.last_sync_at, vitals: v.data, cashbox: c.data });
  }
  return out;
}

function Index() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    let stop = false;
    const push = async () => {
      const live = await loadLive();
      if (!stop) frame.current?.contentWindow?.postMessage({ type: "live", live }, window.location.origin);
    };
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === "ready") push();
      if (e.data?.type === "logout") supabase.auth.signOut();
    };
    window.addEventListener("message", onMsg);
    push();
    const t = setInterval(push, 60_000);
    return () => { stop = true; clearInterval(t); window.removeEventListener("message", onMsg); };
  }, [session]);

  if (session === undefined) return <div className="h-screen bg-background" />;
  if (!session) return <Login />;
  return (
    <div className="h-screen w-full bg-background">
      <iframe ref={frame} src="/hospital.html" title="نبض المشافي" className="h-full w-full border-0" />
    </div>
  );
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("البريد أو كلمة السر غير صحيحة");
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
      setMsg(error ? error.message : "تم إنشاء الحساب. افتح بريدك واضغط رابط التأكيد ثم ادخل.");
    }
    setBusy(false);
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
        <div className="text-center">
          <div className="text-5xl">🏥</div>
          <h1 className="mt-2 text-2xl font-bold text-foreground">نبض المشافي</h1>
          <p className="text-sm text-muted-foreground">{mode === "in" ? "دخول المالك" : "إنشاء حساب المالك"}</p>
        </div>
        <input type="email" required placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground" />
        <input type="password" required minLength={6} placeholder="كلمة السر" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground" />
        {msg && <p className="text-center text-sm text-muted-foreground">{msg}</p>}
        <button disabled={busy} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-60">
          {busy ? "..." : mode === "in" ? "دخول" : "إنشاء حساب"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }} className="w-full text-sm text-muted-foreground underline">
          {mode === "in" ? "ليس لديك حساب؟ أنشئ حساباً" : "لديك حساب؟ ادخل"}
        </button>
      </form>
    </div>
  );
}
