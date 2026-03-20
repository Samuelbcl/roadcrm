"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { supabase } from "@/lib/supabase";

const uid = () => Math.random().toString(36).slice(2, 9);
const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

// Date grouping helper
const getDateGroup = (isoDate) => {
  const d = new Date(isoDate);
  const now = new Date();
  const todayKey = toKey(now);
  const dKey = toKey(d);
  if (dKey === todayKey) return "Aujourd'hui";
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (dKey === toKey(yesterday)) return "Hier";
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  if (d >= weekAgo) return "Cette semaine";
  return "Plus ancien";
};
const GROUP_ORDER = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];

const I = ({ d, size = 20, color = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const INav = (p) => <I d="M3 11l19-9-9 19-2-8-8-2z" {...p} />;
const IMic = (p) => <I d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" {...p} />;
const IStop = (p) => <I d="M6 6h12v12H6z" {...p} />;
const IPlus = (p) => <I d="M12 5v14 M5 12h14" {...p} />;
const IBell = (p) => <I d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0" {...p} />;
const ICheck = (p) => <I d="M20 6L9 17l-5-5" {...p} />;
const ITrash = (p) => <I d="M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...p} />;
const IBack = (p) => <I d="M15 18l-6-6 6-6" {...p} />;
const IFwd = (p) => <I d="M9 18l6-6-6-6" {...p} />;
const IChev = () => <I d="M9 18l6-6-6-6" size={16} color="#9CA3AF" />;
const IRefresh = (p) => <I d="M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10 M1 14l4.64 4.36A9 9 0 0 0 20.49 15" {...p} />;
const ILogout = (p) => <I d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9" {...p} />;
const ICal = (p) => <I d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" {...p} />;
const INote = (p) => <I d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" {...p} />;
const IClose = (p) => <I d="M18 6L6 18 M6 6l12 12" {...p} />;
const ISearch = (p) => <I d="M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M21 21l-4.35-4.35" {...p} />;
const ISettings = (p) => <I d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...p} />;
const IHome = (p) => <I d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" {...p} />;

// ─── Bottom Navigation Bar ───────────────────────────
const BottomNav = ({ view, setView, notes }) => (
  <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 safe-nav-bottom">
    <div className="flex items-center justify-around px-2 py-1.5">
      {[
        { id: "home", icon: IHome, label: "Accueil" },
        { id: "search", icon: ISearch, label: "Recherche" },
        { id: "notes", icon: INote, label: "Notes" },
        { id: "settings", icon: ISettings, label: "Réglages" },
      ].map((tab) => {
        const active = view === tab.id;
        const Icon = tab.icon;
        return (
          <button key={tab.id} onClick={() => setView(tab.id)}
            className={`flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-xl transition-all ${active ? "text-blue-600" : "text-stone-400 active:text-stone-600"}`}>
            <div className="relative">
              <Icon size={20} color={active ? "#2563EB" : "#9CA3AF"} sw={active ? 2 : 1.8} />
              {tab.id === "notes" && notes.length > 0 && <div className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-blue-600" />}
            </div>
            <span className={`text-[10px] font-medium ${active ? "text-blue-600" : "text-stone-400"}`}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Skeleton Components ─────────────────────────────
const SkeletonCard = () => (
  <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3.5 shadow-sm animate-scale-in">
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <div className="skeleton h-4 w-36 mb-2" />
        <div className="skeleton h-3 w-48" />
      </div>
      <div className="skeleton h-8 w-8 rounded-full" />
    </div>
  </div>
);

const SkeletonNextAppt = () => (
  <div className="mx-5 mb-3 p-3 bg-white border border-stone-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-scale-in">
    <div className="flex-1">
      <div className="skeleton h-2.5 w-16 mb-2" />
      <div className="skeleton h-4 w-32 mb-1.5" />
      <div className="skeleton h-3 w-44" />
    </div>
    <div className="skeleton w-10 h-10 rounded-full" />
  </div>
);

const getCalDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let start = first.getDay() - 1; if (start < 0) start = 6;
  const days = [];
  for (let i = start - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), cur: false });
  for (let i = 1; i <= last.getDate(); i++) days.push({ date: new Date(year, month, i), cur: true });
  const rem = 7 - (days.length % 7); if (rem < 7) for (let i = 1; i <= rem; i++) days.push({ date: new Date(year, month + 1, i), cur: false });
  return days;
};

const Sheet = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-4 pt-3 animate-slide-up safe-bottom" style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <div className="w-9 h-1 bg-stone-200 rounded-full mx-auto mb-3" />
        {children}
      </div>
    </div>
  );
};

export default function Home() {
  const { data: session, status } = useSession();
  const [appts, setAppts] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selDate, setSelDate] = useState(new Date());
  const [cMonth, setCMonth] = useState(new Date().getMonth());
  const [cYear, setCYear] = useState(new Date().getFullYear());
  const [view, setView] = useState("home");
  const [selId, setSelId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [voiceId, setVoiceId] = useState(null);
  const [rec, setRec] = useState(false);
  const [trans, setTrans] = useState("");
  const recRef = useRef(null);
  const [fN, setFN] = useState("");
  const [fA, setFA] = useState("");
  const [fD, setFD] = useState(toKey(new Date()));
  const [fT, setFT] = useState("09:00");
  const [remId, setRemId] = useState(null);
  const [rTxt, setRTxt] = useState("");
  const [rDel, setRDel] = useState(null);
  const [notesTab, setNotesTab] = useState("voice");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatar, setAvatar] = useState(() => { if (typeof window === "undefined") return 0; return parseInt(localStorage.getItem("roadcrm-avatar") || "0"); });
  const [navApp, setNavApp] = useState(() => { if (typeof window === "undefined") return "waze"; return localStorage.getItem("roadcrm-nav") || "waze"; });
  const [saved, setSaved] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [savedNav, setSavedNav] = useState(() => { if (typeof window === "undefined") return "waze"; return localStorage.getItem("roadcrm-nav") || "waze"; });
  const [savedAvatar, setSavedAvatar] = useState(() => { if (typeof window === "undefined") return 0; return parseInt(localStorage.getItem("roadcrm-avatar") || "0"); });
  const settingsDirty = navApp !== savedNav || avatar !== savedAvatar;

  const userId = session?.user?.email || "unknown";

  const loadManualAppts = useCallback(async () => {
    if (!supabase || !userId || userId === "unknown") return [];
    const { data } = await supabase.from("appointments").select("*").eq("user_id", userId).order("date", { ascending: true });
    return data ? data.map((a) => ({ ...a, source: "manual", manual: true })) : [];
  }, [userId]);

  const loadNotes = useCallback(async () => {
    if (!supabase || !userId || userId === "unknown") return;
    const { data } = await supabase.from("notes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (data) setNotes(data);
  }, [userId]);

  const fetchAll = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const manualAppts = await loadManualAppts() || [];
      let googleAppts = [];
      if (session.accessToken) {
        try {
          const res = await fetch(`/api/calendar?token=${session.accessToken}`);
          const data = await res.json();
          if (data.appointments) googleAppts = data.appointments;
        } catch (err) { console.error(err); }
      }
      await loadNotes();
      const googleIds = new Set(googleAppts.map((a) => a.id));
      const uniqueManual = manualAppts.filter((a) => !googleIds.has(a.id));
      setAppts([...googleAppts, ...uniqueManual].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [session, loadManualAppts, loadNotes]);

  useEffect(() => { if (session) fetchAll(); }, [session, fetchAll]);

  const getApptNotes = (apptId) => notes.filter((n) => n.appointment_id === apptId);

  const addAppt = async () => {
    if (!fN.trim() || !supabase) return;
    const id = uid();
    const newAppt = { id, user_id: userId, name: fN.trim(), address: fA.trim(), date: fD, time: fT, done: false };
    const { error } = await supabase.from("appointments").insert(newAppt);
    if (error) { console.error(error); return; }
    setAppts((prev) => [...prev, { ...newAppt, source: "manual", manual: true }].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)));
    const [y, m, d] = fD.split("-").map(Number);
    setSelDate(new Date(y, m - 1, d)); setCMonth(m - 1); setCYear(y);
    setFN(""); setFA(""); setFT("09:00"); setFD(toKey(new Date())); setShowForm(false);
  };

  const toggleDone = async (id) => {
    const appt = appts.find((a) => a.id === id);
    if (!appt) return;
    const newDone = !appt.done;
    if (appt.source === "manual" && supabase) await supabase.from("appointments").update({ done: newDone }).eq("id", id);
    setAppts((prev) => prev.map((a) => a.id === id ? { ...a, done: newDone } : a));
  };

  const delAppt = async (id) => {
    if (!supabase) return;
    await supabase.from("notes").delete().eq("appointment_id", id);
    await supabase.from("appointments").delete().eq("id", id);
    setAppts((prev) => prev.filter((a) => a.id !== id));
    setNotes((prev) => prev.filter((n) => n.appointment_id !== id));
    setView("home");
  };

  const delNote = async (id) => {
    if (!supabase) return;
    await supabase.from("notes").delete().eq("id", id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const openNav = (addr) => {
    if (!addr) return;
    const encoded = encodeURIComponent(addr);
    if (navApp === "waze") window.location.href = `https://waze.com/ul?q=${encoded}&navigate=yes`;
    else if (navApp === "google") window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${encoded}`;
    else window.location.href = `https://maps.apple.com/?daddr=${encoded}`;
  };

  // ─── Voice (CONTINUOUS MODE + RESUME) ───────────────────────────
  const startVoice = (id) => { setVoiceId(id); setTrans(""); setRec(false); setShowVoice(true); };

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setTrans("Non supporté."); return; }
    if (recRef.current) { try { recRef.current.stop(); } catch {} }
    const r = new SR();
    r.lang = "fr-FR";
    r.continuous = true;
    r.interimResults = true;
    recRef.current = r;
    const prevText = trans ? trans + " " : "";
    r.onresult = (e) => {
      let current = "";
      for (let i = 0; i < e.results.length; i++) {
        current += e.results[i][0].transcript;
      }
      setTrans(prevText + current);
    };
    r.onerror = (e) => { console.log("Speech error:", e.error); setRec(false); };
    r.onend = () => { setRec(false); };
    r.start();
    setRec(true);
  };

  const stopRec = () => {
    if (recRef.current) { try { recRef.current.stop(); } catch {} recRef.current = null; }
    setRec(false);
  };

  const saveVoice = async () => {
    if (!trans.trim() || !voiceId || !supabase) return;
    const note = { id: uid(), appointment_id: voiceId, user_id: userId, type: "voice", text: trans.trim(), delay: null };
    const { error } = await supabase.from("notes").insert(note);
    if (!error) setNotes((prev) => [{ ...note, created_at: new Date().toISOString() }, ...prev]);
    closeVoice();
  };

  const closeVoice = () => {
    if (recRef.current) { try { recRef.current.stop(); } catch {} recRef.current = null; }
    setShowVoice(false); setTrans(""); setVoiceId(null); setRec(false);
  };

  const openReminder = (id) => { setRemId(id); setRTxt(""); setRDel(null); setShowReminder(true); };
  const saveReminder = async () => {
    if (!rTxt.trim() || !rDel || !remId || !supabase) return;
    const note = { id: uid(), appointment_id: remId, user_id: userId, type: "reminder", text: rTxt.trim(), delay: rDel };
    const { error } = await supabase.from("notes").insert(note);
    if (!error) setNotes((prev) => [{ ...note, created_at: new Date().toISOString() }, ...prev]);
    if ("Notification" in window) Notification.requestPermission().then((p) => { if (p === "granted") setTimeout(() => new Notification("RoadCRM", { body: rTxt.trim() }), rDel * 60 * 1000); });
    setShowReminder(false); setRTxt(""); setRDel(null); setRemId(null);
  };

  const prevMonth = () => { if (cMonth === 0) { setCMonth(11); setCYear(cYear - 1); } else setCMonth(cMonth - 1); };
  const nextMonth = () => { if (cMonth === 11) { setCMonth(0); setCYear(cYear + 1); } else setCMonth(cMonth + 1); };
  const goToday = () => { const n = new Date(); setCMonth(n.getMonth()); setCYear(n.getFullYear()); setSelDate(n); };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-stone-100"><p className="text-stone-400 text-sm">Chargement...</p></div>;
  if (!session) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
            <INav size={28} color="#fff" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">RoadCRM</h1>
          <p className="text-stone-500 text-[14px] leading-relaxed">Le CRM de terrain pour les commerciaux.<br/>Tes rendez-vous, ta route, tes notes.</p>
        </div>
        <button onClick={() => signIn("google")} className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border border-stone-200 rounded-2xl text-[14px] font-semibold text-stone-800 shadow-sm active:bg-stone-50 mb-3">
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuer avec Google
        </button>
        <div className="flex items-center gap-2 justify-center mt-6">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          <p className="text-[11px] text-stone-400">Synchronisation Google Calendar</p>
        </div>
        <div className="flex items-center gap-2 justify-center mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <p className="text-[11px] text-stone-400">Navigation Waze en un clic</p>
        </div>
        <div className="flex items-center gap-2 justify-center mt-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
          <p className="text-[11px] text-stone-400">Notes vocales et rappels</p>
        </div>
        <p className="text-[10px] text-stone-300 text-center mt-8">RoadCRM v1.0</p>
      </div>
    </div>
  );

  const today = new Date();
  const todayKey = toKey(today);
  const selKey = toKey(selDate);
  const calDays = getCalDays(cYear, cMonth);
  const dayAppts = appts.filter((a) => a.date === selKey).sort((a, b) => a.time.localeCompare(b.time));
  const todayAppts = appts.filter((a) => a.date === todayKey);
  const nextAppt = todayAppts.find((a) => !a.done);
  const apptDates = new Set(appts.map((a) => a.date));
  const selDateStr = selDate.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });
  const sel = appts.find((a) => a.id === selId);
  const selNotes = sel ? getApptNotes(sel.id) : [];

  // Notes grouped by type and date
  const voiceNotes = notes.filter((n) => n.type === "voice").map((n) => ({ ...n, apptName: appts.find((a) => a.id === n.appointment_id)?.name || "RDV" }));
  const reminderNotes = notes.filter((n) => n.type === "reminder").map((n) => ({ ...n, apptName: appts.find((a) => a.id === n.appointment_id)?.name || "RDV" }));

  const groupByDate = (items) => {
    const groups = {};
    items.forEach((n) => {
      const g = getDateGroup(n.created_at);
      if (!groups[g]) groups[g] = [];
      groups[g].push(n);
    });
    return GROUP_ORDER.filter((g) => groups[g]).map((g) => ({ label: g, items: groups[g] }));
  };

  // ═══════════════════ AVATARS ═══════════════════════════════════════
  const avatarCount = 6;
  const AvatarImg = ({ index, size = 40 }) => (
    <img src={`/avatar-${index + 1}.png`} alt={`Avatar ${index + 1}`} width={size} height={size} className="object-contain" />
  );

  // ═══════════════════ SETTINGS VIEW ════════════════════════════════
  if (view === "settings") return (
    <div className="min-h-screen bg-stone-100">
      {showUnsaved && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-5 mx-8 w-full max-w-xs shadow-xl">
            <p className="text-[15px] font-semibold text-stone-800 mb-1">Modifications non sauvegardées</p>
            <p className="text-[13px] text-stone-500 mb-5">Voulez-vous sauvegarder vos changements ?</p>
            <div className="flex gap-2">
              <button onClick={() => { setNavApp(savedNav); setAvatar(savedAvatar); setShowUnsaved(false); setView("home"); }}
                className="flex-1 py-2.5 text-[13px] font-medium text-stone-600 bg-stone-100 rounded-xl active:bg-stone-200">Annuler</button>
              <button onClick={() => { localStorage.setItem("roadcrm-nav", navApp); localStorage.setItem("roadcrm-avatar", String(avatar)); setSavedNav(navApp); setSavedAvatar(avatar); setShowUnsaved(false); setSaved(true); setTimeout(() => { setSaved(false); setView("home"); }, 800); }}
                className="flex-1 py-2.5 text-[13px] font-semibold text-white bg-blue-600 rounded-xl active:bg-blue-700">Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
      <div className="px-5 pt-4 pb-2"><button onClick={() => { if (settingsDirty) { setShowUnsaved(true); } else { setView("home"); } }} className="flex items-center gap-1.5 text-[13px] text-stone-500 font-medium"><IBack size={18} color="#6B6B6B" /> Retour</button></div>
      <div className="px-5">
        <h1 className="text-xl font-bold tracking-tight mb-1">Réglages</h1>
        <p className="text-[12px] text-stone-400 mb-4">{session?.user?.email}</p>
      </div>
      <div className="px-5 pb-20">
        {/* Account + Avatar */}
        <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Compte</h3>
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden mb-5 shadow-sm">
          <button onClick={() => setShowAvatarPicker(!showAvatarPicker)} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-stone-50">
            <AvatarImg index={avatar} size={44} />
            <div className="flex-1">
              <p className="text-[13px] font-medium text-stone-800">{session?.user?.name || "Utilisateur"}</p>
              <p className="text-[11px] text-stone-400">Changer d{"'"}avatar</p>
            </div>
            <IChev />
          </button>
          {showAvatarPicker && (
            <div className="px-4 py-3 border-t border-stone-100">
              <p className="text-[11px] text-stone-400 mb-2">Choisis ton avatar</p>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: avatarCount }, (_, i) => (
                  <button key={i} onClick={() => { setAvatar(i); setShowAvatarPicker(false); }}
                    className={`rounded-full p-0.5 transition-all ${avatar === i ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}>
                    <AvatarImg index={i} size={40} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications */}
        <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Notifications</h3>
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden divide-y divide-stone-100 mb-5 shadow-sm">
          <button onClick={() => {
            if ("Notification" in window) {
              Notification.requestPermission().then((p) => {
                if (p === "granted") alert("Notifications activées !");
                else if (p === "denied") alert("Notifications bloquées. Vas dans les réglages de Safari pour les activer.");
                else alert("Notifications en attente.");
              });
            } else { alert("Les notifications ne sont pas supportées sur ce navigateur."); }
          }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><IBell size={16} color="#7C3AED" /></div>
            Activer les notifications
            <span className="ml-auto"><IChev /></span>
          </button>
        </div>

        {/* Navigation picker */}
        <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Navigation</h3>
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden mb-5 shadow-sm">
          {[
            { id: "waze", name: "Waze", desc: "Navigation communautaire", logo: (
              <img src="/waze-logo.png" alt="Waze" width={28} height={28} className="object-contain" />
            )},
            { id: "google", name: "Google Maps", desc: "Navigation Google", logo: (
              <img src="/google-maps-logo.png" alt="Google Maps" width={28} height={28} className="object-contain" />
            )},
            { id: "apple", name: "Apple Plans", desc: "Navigation Apple", logo: (
              <img src="/apple-maps-logo.png" alt="Apple Plans" width={28} height={28} className="object-contain" />
            )},
          ].map((app, i) => (
            <button key={app.id} onClick={() => { setNavApp(app.id); }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left active:bg-stone-50 ${i > 0 ? "border-t border-stone-100" : ""}`}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                {app.logo}
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-stone-800">{app.name}</p>
                <p className="text-[11px] text-stone-400">{app.desc}</p>
              </div>
              {navApp === app.id && <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center"><ICheck size={12} color="#fff" sw={2.5} /></div>}
            </button>
          ))}
        </div>

        {/* Save */}
        <button onClick={() => {
          localStorage.setItem("roadcrm-avatar", String(avatar));
          localStorage.setItem("roadcrm-nav", navApp);
          setSavedNav(navApp);
          setSavedAvatar(avatar);
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
          className={`w-full flex items-center justify-center gap-2 py-3 text-[13px] font-semibold rounded-2xl shadow-sm active:scale-[0.98] transition-all mb-3 ${saved ? "bg-green-600 text-white" : "bg-stone-900 text-white"}`}>
          {saved ? <><ICheck size={16} color="#fff" sw={2.5} /> Sauvegardé !</> : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Sauvegarder</>}
        </button>

        {/* Logout */}
        <button onClick={() => { if (window.confirm("Se déconnecter ?")) signOut(); }}
          className="w-full flex items-center justify-center gap-2 py-3 text-[13px] font-medium text-red-600 bg-white border border-stone-200 rounded-2xl shadow-sm active:bg-red-50">
          <ILogout size={16} color="#DC2626" /> Se déconnecter
        </button>

        <p className="text-[10px] text-stone-300 text-center mt-6">RoadCRM v1.0</p>
      </div>
    </div>
  );

  // ═══════════════════ SEARCH VIEW ══════════════════════════════════
  // Fuzzy search: ignore accents, apostrophes, hyphens, tolerate typos
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[''`\-_.,:;]/g, "").replace(/\s+/g, " ").trim();
  const fuzzyMatch = (text, query) => {
    const t = normalize(text);
    const q = normalize(query);
    if (t.includes(q)) return true;
    // Check each word of query
    const words = q.split(" ").filter(Boolean);
    if (words.every((w) => t.includes(w))) return true;
    // Tolerate 1 char difference per word (simple fuzzy)
    return words.some((w) => {
      if (w.length < 3) return t.includes(w);
      for (let i = 0; i < t.length - w.length + 1; i++) {
        const chunk = t.substring(i, i + w.length);
        let diff = 0;
        for (let j = 0; j < w.length; j++) { if (chunk[j] !== w[j]) diff++; }
        if (diff <= 1) return true;
      }
      return false;
    });
  };
  const searchResults = searchQuery.trim().length >= 2 ? appts.filter((a) => {
    const aNotes = getApptNotes(a.id);
    return fuzzyMatch(a.name, searchQuery) || (a.address && fuzzyMatch(a.address, searchQuery)) || aNotes.some((n) => fuzzyMatch(n.text, searchQuery));
  }) : [];

  if (view === "search") return (
    <div className="min-h-screen bg-stone-100">
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("home"); setSearchQuery(""); setShowSearch(false); }} className="flex-shrink-0"><IBack size={18} color="#6B6B6B" /></button>
          <div className="flex-1 relative">
            <input
              className="w-full px-3 py-2.5 pl-9 bg-white border border-stone-200 rounded-xl text-[14px] outline-none focus:border-blue-500 transition shadow-sm"
              placeholder="Chercher un client, une adresse, une note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="absolute left-2.5 top-2.5 pointer-events-none"><ISearch size={16} color="#9CA3AF" /></div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-2 pb-20">
        {searchQuery.trim().length < 2 ? (
          <p className="text-[13px] text-stone-400 text-center py-8">Tape au moins 2 caractères</p>
        ) : searchResults.length === 0 ? (
          <p className="text-[13px] text-stone-400 text-center py-8">Aucun résultat pour "{searchQuery}"</p>
        ) : (
          <>
            <p className="text-[12px] text-stone-400 mb-3">{searchResults.length} résultat{searchResults.length !== 1 ? "s" : ""}</p>
            <div className="flex flex-col gap-1.5">
              {searchResults.map((a) => {
                const aNotes = getApptNotes(a.id);
                return (
                  <div key={a.id} onClick={() => { setSelId(a.id); setView("detail"); }}
                    className={`bg-white border border-stone-200 rounded-2xl px-4 py-3 active:bg-stone-50 shadow-sm ${a.done ? "opacity-40" : ""}`}>
                    <div className="flex justify-between items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold leading-snug">{a.name}</p>
                        <p className="text-[12px] text-stone-500 mt-0.5 truncate">{a.address || "Pas d'adresse"}</p>
                        <p className="text-[11px] text-stone-400 mt-0.5">{new Date(a.date + "T00:00").toLocaleDateString("fr-BE", { day: "numeric", month: "short" })} à {a.time}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        {a.address && <button onClick={(e) => { e.stopPropagation(); openNav(a.address); }} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center active:scale-95"><INav size={14} color="#fff" /></button>}
                      </div>
                    </div>
                    {aNotes.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {aNotes.slice(0, 2).map((n) => <span key={n.id} className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">{n.type === "voice" ? <IMic size={10} /> : <IBell size={10} />} {n.text.length > 20 ? n.text.slice(0, 20) + "…" : n.text}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ═══════════════════ NOTES VIEW ═════════════════════════════════
  if (view === "notes") {
    const activeNotes = notesTab === "voice" ? voiceNotes : reminderNotes;
    const grouped = groupByDate(activeNotes);
    return (
      <div className="min-h-screen bg-stone-100">
        <div className="px-5 pt-4 pb-2"><button onClick={() => setView("home")} className="flex items-center gap-1.5 text-[13px] text-stone-500 font-medium"><IBack size={18} color="#6B6B6B" /> Retour</button></div>
        <div className="px-5 mb-3">
          <h1 className="text-xl font-bold tracking-tight mb-3">Notes & Rappels</h1>
          {/* Tabs */}
          <div className="flex bg-white rounded-xl border border-stone-200 p-1 shadow-sm">
            <button onClick={() => setNotesTab("voice")}
              className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${notesTab === "voice" ? "bg-stone-900 text-white" : "text-stone-500"}`}>
              <IMic size={14} /> Vocales ({voiceNotes.length})
            </button>
            <button onClick={() => setNotesTab("reminder")}
              className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5 ${notesTab === "reminder" ? "bg-stone-900 text-white" : "text-stone-500"}`}>
              <IBell size={14} /> Rappels ({reminderNotes.length})
            </button>
          </div>
        </div>

        <div className="px-5 pb-20">
          {grouped.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[13px] text-stone-400">{notesTab === "voice" ? "Aucune note vocale." : "Aucun rappel."}</p>
              <p className="text-[12px] text-stone-400 mt-1">Crée-en depuis un rendez-vous.</p>
            </div>
          ) : grouped.map((group) => (
            <div key={group.label} className="mb-4">
              <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">{group.label}</h3>
              <div className="flex flex-col gap-1.5">
                {group.items.map((n) => (
                  <div key={n.id} className="bg-white border border-stone-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-stone-400 font-medium mb-1">{n.apptName}</p>
                        <p className="text-[13px] text-stone-800 leading-relaxed">{n.text}</p>
                        <p className="text-[11px] text-stone-400 mt-1.5">
                          {new Date(n.created_at).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}
                          {n.delay ? ` · rappel ${n.delay} min` : ""}
                        </p>
                      </div>
                      <button onClick={() => delNote(n.id)} className="p-1.5 rounded-lg active:bg-red-50 flex-shrink-0">
                        <ITrash size={14} color="#9CA3AF" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ═══════════════════ DETAIL VIEW ════════════════════════════════
  if (view === "detail" && sel) return (
    <div className="min-h-screen bg-stone-100">
      <div className="px-5 pt-4 pb-2"><button onClick={() => setView("home")} className="flex items-center gap-1.5 text-[13px] text-stone-500 font-medium"><IBack size={18} color="#6B6B6B" /> Retour</button></div>
      <div className="px-5 pb-32">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[13px] text-stone-500 font-medium">{sel.time}{sel.timeEnd ? ` – ${sel.timeEnd}` : ""}</span>
          {sel.done && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded uppercase">Terminé</span>}
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-1">{sel.name}</h1>
        <p className="text-[13px] text-stone-500 leading-relaxed mb-5">{sel.address || "Aucune adresse"}</p>

        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden divide-y divide-stone-100 mb-5 shadow-sm">
          <button onClick={() => openNav(sel.address)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50" style={{ opacity: sel.address ? 1 : 0.4 }}>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><INav size={16} color="#2563EB" /></div>Lancer Waze<span className="ml-auto"><IChev /></span>
          </button>
          <button onClick={() => startVoice(sel.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><IMic size={16} color="#EA580C" /></div>Note vocale<span className="ml-auto"><IChev /></span>
          </button>
          <button onClick={() => openReminder(sel.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><IBell size={16} color="#7C3AED" /></div>Rappel<span className="ml-auto"><IChev /></span>
          </button>
          <button onClick={() => toggleDone(sel.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sel.done ? "bg-green-50" : "bg-stone-100"}`}><ICheck size={16} color={sel.done ? "#16A34A" : "#9CA3AF"} /></div>
            {sel.done ? "Terminé ✓" : "Marquer terminé"}<span className="ml-auto"><IChev /></span>
          </button>
        </div>

        {sel.source === "manual" && <button onClick={() => delAppt(sel.id)} className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium text-red-600 rounded-xl active:bg-red-50"><ITrash size={15} color="#DC2626" /> Supprimer</button>}

        {selNotes.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Notes sur ce RDV</h3>
            {selNotes.map((n) => (
              <div key={n.id} className="bg-white border border-stone-200 rounded-xl p-3 mb-1.5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${n.type === "voice" ? "bg-orange-50 text-orange-600" : "bg-violet-50 text-violet-600"}`}>{n.type === "voice" ? "Vocal" : "Rappel"}</span>
                      <span className="text-[11px] text-stone-400">{new Date(n.created_at).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-[13px] text-stone-800 leading-relaxed">{n.text}</p>
                  </div>
                  <button onClick={() => delNote(n.id)} className="p-1.5 rounded-lg active:bg-red-50"><ITrash size={14} color="#9CA3AF" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice modal - CONTINUOUS + RESUME */}
      {showVoice && (
        <div className="fixed inset-0 bg-white/97 backdrop-blur-xl z-50 flex flex-col items-center justify-center animate-fade-in">
          <button onClick={closeVoice} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center"><IClose size={20} color="#6B6B6B" /></button>
          <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm">
            <p className="text-[13px] font-semibold text-stone-500 uppercase tracking-wider">
              {rec ? "Écoute en cours..." : trans ? "En pause — appuie pour reprendre" : "Note vocale"}
            </p>

            <button onClick={rec ? stopRec : startRec}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${rec ? "bg-red-100 border-[3px] border-red-500" : "bg-orange-50 border-[3px] border-orange-300"}`}>
              {rec ? <IStop size={36} color="#DC2626" /> : <IMic size={36} color="#EA580C" />}
            </button>

            <p className="text-[12px] text-stone-400">
              {rec ? "Appuie pour mettre en pause" : trans ? "Appuie pour reprendre la dictée" : "Appuie pour commencer"}
            </p>

            {trans && (
              <div className="bg-stone-50 rounded-xl px-4 py-3 w-full">
                <p className="text-[14px] text-stone-800 leading-relaxed">{trans}</p>
              </div>
            )}

            {trans && !rec && (
              <div className="flex gap-3 w-full">
                <button onClick={() => setTrans("")} className="flex-1 py-2.5 rounded-xl bg-stone-100 text-[13px] font-semibold text-stone-600">Effacer</button>
                <button onClick={saveVoice} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-[13px] font-semibold text-white">Enregistrer</button>
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet open={showReminder} onClose={() => setShowReminder(false)}>
        <h2 className="text-base font-bold mb-3">Nouveau rappel</h2>
        <label className="block text-[11px] font-semibold text-stone-500 mb-1">Message</label>
        <input className="w-full px-3 py-2 bg-stone-100 rounded-lg text-[14px] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition mb-3" placeholder="Ex: Envoyer le devis..." value={rTxt} onChange={(e) => setRTxt(e.target.value)} />
        <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">Délai</label>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[{ l: "5 min", v: 5 }, { l: "15 min", v: 15 }, { l: "30 min", v: 30 }, { l: "1h", v: 60 }, { l: "2h", v: 120 }, { l: "Demain", v: 1440 }].map((o) => (
            <button key={o.v} onClick={() => setRDel(o.v)} className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${rDel === o.v ? "bg-blue-50 text-blue-600 border-2 border-blue-300 font-semibold" : "bg-stone-100 text-stone-500 border-2 border-transparent"}`}>{o.l}</button>
          ))}
        </div>
        <button onClick={saveReminder} className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-[14px] font-semibold mb-4" style={{ opacity: rTxt && rDel ? 1 : 0.35 }}>Programmer</button>
      </Sheet>
    </div>
  );

  const doneCount = todayAppts.filter((a) => a.done).length;
  const totalCount = todayAppts.length;

  // ═══════════════════ HOME VIEW ══════════════════════════════════
  return (
    <div className="min-h-screen bg-stone-100 animate-view-in">
      <div className="px-5 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("settings")} className="active:scale-95 transition-transform">
            <AvatarImg index={avatar} size={36} />
          </button>
          <div>
            <h1 className="text-[17px] font-bold tracking-tight leading-tight">RoadCRM</h1>
            <p className="text-[11px] text-stone-400 leading-tight">{session?.user?.name || "Mon compte"}</p>
          </div>
        </div>
        <button onClick={fetchAll} className={`p-2 rounded-lg active:bg-stone-200 ${loading ? "animate-spin" : ""}`}><IRefresh size={16} color="#9CA3AF" /></button>
      </div>

      <div className="px-5 mb-3">
        <p className="text-[12px] text-stone-400">{totalCount} RDV aujourd{"'"}hui · {doneCount} terminé{doneCount !== 1 ? "s" : ""}</p>
        {totalCount > 0 && (
          <div className="mt-1.5 h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-progress" style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }} />
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonNextAppt />
      ) : nextAppt ? (
        <div className="mx-5 mb-3 p-3 bg-white border border-stone-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-scale-in">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Prochain</p>
            <p className="text-[14px] font-semibold truncate">{nextAppt.name}</p>
            <p className="text-[12px] text-stone-500 truncate mt-0.5">{nextAppt.time}{nextAppt.address ? ` · ${nextAppt.address}` : ""}</p>
          </div>
          {nextAppt.address && <button onClick={() => openNav(nextAppt.address)} className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 active:scale-95"><INav size={16} color="#fff" /></button>}
        </div>
      ) : null}

      <div className="mx-5 mt-1 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <button onClick={prevMonth} className="p-1 rounded-lg active:bg-stone-100"><IBack size={18} color="#6B6B6B" /></button>
          <button onClick={goToday} className="text-[14px] font-semibold text-stone-800">{MONTHS[cMonth]} {cYear}</button>
          <button onClick={nextMonth} className="p-1 rounded-lg active:bg-stone-100"><IFwd size={18} color="#6B6B6B" /></button>
        </div>
        <div className="grid grid-cols-7 px-2">{DAYS.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-stone-400 py-1">{d}</div>)}</div>
        <div className="grid grid-cols-7 px-2 pb-2">
          {calDays.map(({ date, cur }, i) => {
            const key = toKey(date); const isSel = key === selKey; const isTd = key === todayKey; const has = apptDates.has(key);
            return (
              <button key={i} onClick={() => setSelDate(new Date(date))} className="flex flex-col items-center py-1 rounded-xl" style={{ background: isSel ? "#2563EB" : "transparent", opacity: cur ? 1 : 0.25 }}>
                <span className={`text-[13px] leading-none ${isSel ? "text-white font-semibold" : isTd ? "text-blue-600 font-bold" : "text-stone-700 font-medium"}`}>{date.getDate()}</span>
                <div className="h-1 mt-0.5">{has && <div className={`w-1 h-1 rounded-full mx-auto ${isSel ? "bg-white/70" : "bg-blue-500"}`} />}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-stone-800 capitalize">{selDateStr}</h2>
        <p className="text-[12px] text-stone-400 mt-0.5">{dayAppts.length === 0 ? "Aucun rendez-vous" : `${dayAppts.length} rendez-vous`}{selKey === todayKey && " · Aujourd'hui"}</p>
      </div>

      <div className="px-5 flex flex-col gap-1.5 pb-32">
        {loading ? (
          <>{[0, 1, 2].map((i) => <SkeletonCard key={i} />)}</>
        ) : dayAppts.length === 0 ? (
          <div className="text-center py-10 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mx-auto mb-3"><ICal size={22} color="#9CA3AF" /></div>
            <p className="text-[13px] text-stone-500 font-medium">Rien de prévu</p>
            <p className="text-[12px] text-stone-400 mt-1">Ajoute un rendez-vous avec le bouton +</p>
          </div>
        ) : dayAppts.map((a, idx) => {
          const aNotes = getApptNotes(a.id);
          return (
            <div key={a.id} onClick={() => { setSelId(a.id); setView("detail"); }}
              className={`bg-white border rounded-2xl px-4 py-3 active:bg-stone-50 shadow-sm animate-list-item ${a.done ? "border-green-200 bg-green-50/30" : "border-stone-200"}`}
              style={{ animationDelay: `${idx * 60}ms` }}>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {a.done && <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5"><ICheck size={12} color="#fff" sw={2.5} /></div>}
                  <div className="min-w-0 flex-1">
                    <p className={`text-[14px] font-semibold leading-snug ${a.done ? "line-through text-stone-400" : ""}`}>{a.name}</p>
                    <p className={`text-[12px] mt-0.5 truncate ${a.done ? "text-stone-400" : "text-stone-500"}`}>{a.address || "Pas d'adresse"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="font-mono text-[12px] text-stone-500 font-medium">{a.time}</span>
                  {a.address && <button onClick={(e) => { e.stopPropagation(); openNav(a.address); }} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center active:scale-95"><INav size={14} color="#fff" /></button>}
                </div>
              </div>
              {aNotes.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {aNotes.slice(0, 2).map((n) => <span key={n.id} className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full flex items-center gap-1">{n.type === "voice" ? <IMic size={10} /> : <IBell size={10} />} {n.text.length > 20 ? n.text.slice(0, 20) + "…" : n.text}</span>)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => { setFD(selKey); setShowForm(true); }} className="fixed bottom-20 right-5 w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center shadow-lg active:scale-95 z-40"><IPlus size={22} color="#fff" /></button>

      <Sheet open={showForm} onClose={() => setShowForm(false)}>
        <h2 className="text-base font-bold mb-3">Nouveau rendez-vous</h2>
        <label className="block text-[11px] font-semibold text-stone-500 mb-1">Client</label>
        <input className="w-full px-3 py-2 bg-stone-100 rounded-lg text-[14px] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition mb-2.5" placeholder="Nom du client ou entreprise" value={fN} onChange={(e) => setFN(e.target.value)} />
        <label className="block text-[11px] font-semibold text-stone-500 mb-1">Adresse</label>
        <input className="w-full px-3 py-2 bg-stone-100 rounded-lg text-[14px] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition mb-2.5" placeholder="Adresse complète" value={fA} onChange={(e) => setFA(e.target.value)} />
        <div className="flex gap-2 mb-3">
          <div className="flex-1"><label className="block text-[11px] font-semibold text-stone-500 mb-1">Date</label><input type="date" className="w-full px-3 py-2 bg-stone-100 rounded-lg text-[14px] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition" value={fD} onChange={(e) => setFD(e.target.value)} /></div>
          <div className="flex-1"><label className="block text-[11px] font-semibold text-stone-500 mb-1">Heure</label><input type="time" className="w-full px-3 py-2 bg-stone-100 rounded-lg text-[14px] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition" value={fT} onChange={(e) => setFT(e.target.value)} /></div>
        </div>
        <button onClick={addAppt} className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-[14px] font-semibold" style={{ opacity: fN.trim() ? 1 : 0.35 }}>Ajouter</button>
        <button onClick={() => setShowForm(false)} className="w-full py-2 text-[13px] text-stone-500 font-medium mt-1.5 mb-4">Annuler</button>
      </Sheet>
      <BottomNav view={view} setView={setView} notes={notes} />
    </div>
  );
}