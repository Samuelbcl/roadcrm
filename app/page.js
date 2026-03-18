"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const uid = () => Math.random().toString(36).slice(2, 9);
const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const I = ({ d, size = 20, color = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const INav = (p) => <I d="M3 11l19-9-9 19-2-8-8-2z" {...p} />;
const IMic = (p) => <I d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2 M12 19v4 M8 23h8" {...p} />;
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

const getLocal = () => { if (typeof window === "undefined") return {}; try { return JSON.parse(localStorage.getItem("roadcrm-local") || "{}"); } catch { return {}; } };
const setLocal = (d) => { if (typeof window === "undefined") return; localStorage.setItem("roadcrm-local", JSON.stringify(d)); };

const getCalendarDays = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let startDay = first.getDay() - 1;
  if (startDay < 0) startDay = 6;
  const days = [];
  for (let i = startDay - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), current: false });
  for (let i = 1; i <= last.getDate(); i++) days.push({ date: new Date(year, month, i), current: true });
  const rem = 7 - (days.length % 7);
  if (rem < 7) for (let i = 1; i <= rem; i++) days.push({ date: new Date(year, month + 1, i), current: false });
  return days;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [view, setView] = useState("list");
  const [selId, setSelId] = useState(null);
  const [showVoice, setShowVoice] = useState(false);
  const [showReminder, setShowReminder] = useState(false);
  const [voiceId, setVoiceId] = useState(null);
  const [remId, setRemId] = useState(null);
  const [rec, setRec] = useState(false);
  const [trans, setTrans] = useState("");
  const rRef = useRef(null);
  const [fN, setFN] = useState("");
  const [fA, setFA] = useState("");
  const [fD, setFD] = useState(toKey(new Date()));
  const [fT, setFT] = useState("09:00");
  const [rTxt, setRTxt] = useState("");
  const [rDel, setRDel] = useState(null);

  useEffect(() => {
    const local = getLocal();
    const manual = Object.entries(local).filter(([_, v]) => v && v.manual).map(([_, v]) => v);
    if (manual.length > 0) setAppointments(manual.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)));
  }, []);

  const fetchEvents = useCallback(async () => {
    if (!session?.accessToken) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/calendar?token=${session.accessToken}`);
      const data = await res.json();
      if (data.appointments) {
        const local = getLocal();
        const merged = data.appointments.map((a) => ({ ...a, notes: local[a.id]?.notes || [], done: local[a.id]?.done || false }));
        const manual = Object.entries(local).filter(([_, v]) => v && v.manual).map(([_, v]) => v);
        const ids = new Set(merged.map((a) => a.id));
        const unique = manual.filter((a) => !ids.has(a.id));
        setAppointments([...merged, ...unique].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [session?.accessToken]);

  useEffect(() => { if (session?.accessToken) fetchEvents(); }, [session?.accessToken, fetchEvents]);

  const upd = useCallback((id, fn) => {
    setAppointments((prev) => {
      const updated = prev.map((a) => (a.id === id ? fn(a) : a));
      const local = getLocal();
      const item = updated.find((a) => a.id === id);
      if (item) {
        if (item.source === "manual") local[id] = { ...item, manual: true };
        else local[id] = { ...local[id], notes: item.notes, done: item.done };
        setLocal(local);
      }
      return updated;
    });
  }, []);

  const addAppt = () => {
    if (!fN.trim()) return;
    const n = { id: uid(), name: fN.trim(), address: fA.trim(), date: fD, time: fT, notes: [], done: false, source: "manual", manual: true };
    setAppointments((prev) => [...prev, n].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)));
    const local = getLocal(); local[n.id] = { ...n, manual: true }; setLocal(local);
    setFN(""); setFA(""); setFT("09:00");
    const [y, m, d] = fD.split("-").map(Number);
    setSelectedDate(new Date(y, m - 1, d));
    setFD(toKey(new Date()));
    setView("list");
  };

  const delAppt = (id) => { setAppointments((prev) => prev.filter((a) => a.id !== id)); const local = getLocal(); delete local[id]; setLocal(local); setView("list"); };
  const nav = (addr) => { if (!addr) return; window.open(`https://waze.com/ul?q=${encodeURIComponent(addr)}&navigate=yes`, "_blank"); };

  const startV = (id) => { setVoiceId(id); setTrans(""); setShowVoice(true); setRec(false); };
  const toggleR = () => {
    if (rec) { rRef.current?.stop(); setRec(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setTrans("Non supporté."); return; }
    const r = new SR(); r.lang = "fr-FR"; r.continuous = true; r.interimResults = true; rRef.current = r;
    r.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setTrans(t); };
    r.onerror = () => setRec(false); r.onend = () => setRec(false);
    r.start(); setRec(true);
  };
  const saveV = () => {
    if (!trans.trim() || !voiceId) return;
    upd(voiceId, (a) => ({ ...a, notes: [...a.notes, { id: uid(), type: "voice", text: trans.trim(), time: new Date().toISOString() }] }));
    setShowVoice(false); setTrans(""); setVoiceId(null);
  };
  const openRem = (id) => { setRemId(id); setRTxt(""); setRDel(null); setShowReminder(true); };
  const saveRem = () => {
    if (!rTxt.trim() || !rDel || !remId) return;
    upd(remId, (a) => ({ ...a, notes: [...a.notes, { id: uid(), type: "reminder", text: rTxt.trim(), delay: rDel, time: new Date().toISOString() }] }));
    if ("Notification" in window) Notification.requestPermission().then((p) => { if (p === "granted") setTimeout(() => new Notification("RoadCRM", { body: rTxt.trim() }), rDel * 60 * 1000); });
    setShowReminder(false); setRTxt(""); setRDel(null); setRemId(null);
  };

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };
  const goToday = () => { const n = new Date(); setCalMonth(n.getMonth()); setCalYear(n.getFullYear()); setSelectedDate(n); };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-stone-100"><p className="text-stone-400 text-sm">Chargement...</p></div>;

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4"><ICal size={24} color="#fff" /></div>
        <h1 className="text-2xl font-bold mb-1 tracking-tight">RoadCRM</h1>
        <p className="text-stone-500 text-sm mb-8">Connecte ton Google Calendar pour synchroniser tes rendez-vous.</p>
        <button onClick={() => signIn("google")} className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 shadow-sm">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Se connecter avec Google
        </button>
      </div>
    </div>
  );

  const today = new Date();
  const todayKey = toKey(today);
  const selectedKey = toKey(selectedDate);
  const calDays = getCalendarDays(calYear, calMonth);
  const selectedAppts = appointments.filter((a) => a.date === selectedKey).sort((a, b) => a.time.localeCompare(b.time));
  const isToday = selectedKey === todayKey;
  const sel = appointments.find((a) => a.id === selId);
  const apptDates = new Set(appointments.map((a) => a.date));
  const selDateStr = selectedDate.toLocaleDateString("fr-BE", { weekday: "long", day: "numeric", month: "long" });

  // ── Detail ──
  if (view === "detail" && sel) return (
    <div className="min-h-screen bg-stone-100">
      <div className="px-5 pt-4 pb-2">
        <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-[13px] text-stone-500 font-medium"><IBack size={18} color="#6B6B6B" /> Retour</button>
      </div>
      <div className="px-5 pb-32">
        <p className="font-mono text-[13px] text-stone-500 font-medium">{sel.time}{sel.timeEnd ? ` – ${sel.timeEnd}` : ""}</p>
        <h1 className="text-xl font-bold tracking-tight mt-0.5 mb-1">{sel.name}</h1>
        <p className="text-[13px] text-stone-500 leading-relaxed mb-5">{sel.address || "Aucune adresse"}</p>
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden divide-y divide-stone-100 mb-5 shadow-sm">
          <button onClick={() => nav(sel.address)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50" style={{ opacity: sel.address ? 1 : 0.4 }}>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><INav size={16} color="#2563EB" /></div>Lancer Waze<span className="ml-auto"><IChev /></span>
          </button>
          <button onClick={() => startV(sel.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50">
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><IMic size={16} color="#EA580C" /></div>Note vocale<span className="ml-auto"><IChev /></span>
          </button>
          <button onClick={() => openRem(sel.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><IBell size={16} color="#7C3AED" /></div>Rappel<span className="ml-auto"><IChev /></span>
          </button>
          <button onClick={() => upd(sel.id, (a) => ({ ...a, done: !a.done }))} className="w-full flex items-center gap-3 px-4 py-3 text-left text-[13px] font-medium text-stone-800 active:bg-stone-50">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sel.done ? "bg-green-50" : "bg-stone-100"}`}><ICheck size={16} color={sel.done ? "#16A34A" : "#9CA3AF"} /></div>
            {sel.done ? "Terminé" : "Marquer terminé"}<span className="ml-auto"><IChev /></span>
          </button>
        </div>
        {sel.source !== "google" && <button onClick={() => delAppt(sel.id)} className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium text-red-600 rounded-xl active:bg-red-50"><ITrash size={15} color="#DC2626" /> Supprimer</button>}
        {sel.notes.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">Notes</h3>
            {sel.notes.map((n) => (
              <div key={n.id} className="bg-white border border-stone-200 rounded-xl p-3 mb-1.5 shadow-sm">
                <p className={`text-[11px] font-semibold mb-0.5 ${n.type === "voice" ? "text-orange-600" : "text-violet-600"}`}>{n.type === "voice" ? "Note vocale" : "Rappel"}</p>
                <p className="text-[13px] text-stone-800 leading-relaxed">{n.text}</p>
                <p className="text-[11px] text-stone-400 mt-1">{new Date(n.time).toLocaleTimeString("fr-BE", { hour: "2-digit", minute: "2-digit" })}{n.delay ? ` · rappel dans ${n.delay} min` : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {showVoice && (
        <div className="fixed inset-0 bg-white/97 backdrop-blur-xl z-50 flex flex-col items-center justify-center gap-4 animate-fade-in" onClick={() => { rRef.current?.stop(); setShowVoice(false); }}>
          <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-4">
            <button onClick={toggleR} className={`w-20 h-20 rounded-full flex items-center justify-center relative transition-all ${rec ? "bg-orange-100 border-2 border-orange-500" : "bg-orange-50 border-2 border-transparent"}`}><IMic size={32} color={rec ? "#EA580C" : "#9CA3AF"} /></button>
            <p className="text-[13px] text-stone-500">{rec ? "Écoute en cours..." : "Appuyer pour dicter"}</p>
            <p className="text-base font-medium text-stone-800 text-center max-w-[280px] leading-relaxed min-h-[36px]">{trans}</p>
            {trans && !rec && (
              <div className="flex gap-3 mt-1">
                <button onClick={() => setTrans("")} className="px-5 py-2 rounded-lg bg-stone-100 text-[13px] font-semibold text-stone-600">Refaire</button>
                <button onClick={saveV} className="px-5 py-2 rounded-lg bg-stone-900 text-[13px] font-semibold text-white">Enregistrer</button>
              </div>
            )}
          </div>
        </div>
      )}
      {showReminder && (
        <div className="fixed inset-0 z-50"><div className="absolute inset-0 bg-black/25" onClick={() => setShowReminder(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-4 pt-4 animate-slide-up safe-bottom">
            <div className="w-9 h-1 bg-stone-200 rounded-full mx-auto mb-3" />
            <h2 className="text-base font-bold mb-3">Nouveau rappel</h2>
            <label className="block text-[11px] font-semibold text-stone-500 mb-1">Message</label>
            <input className="w-full px-3 py-2 bg-stone-100 rounded-lg text-[14px] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white transition mb-3" placeholder="Ex: Envoyer le devis..." value={rTxt} onChange={(e) => setRTxt(e.target.value)} />
            <label className="block text-[11px] font-semibold text-stone-500 mb-1.5">Délai</label>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {[{ l: "5 min", v: 5 }, { l: "15 min", v: 15 }, { l: "30 min", v: 30 }, { l: "1h", v: 60 }, { l: "2h", v: 120 }, { l: "Demain", v: 1440 }].map((o) => (
                <button key={o.v} onClick={() => setRDel(o.v)} className={`px-3 py-1.5 rounded-full text-[13px] font-medium ${rDel === o.v ? "bg-blue-50 text-blue-600 border-2 border-blue-300 font-semibold" : "bg-stone-100 text-stone-500 border-2 border-transparent"}`}>{o.l}</button>
              ))}
            </div>
            <button onClick={saveRem} className="w-full py-2.5 bg-stone-900 text-white rounded-lg text-[14px] font-semibold mb-4" style={{ opacity: rTxt && rDel ? 1 : 0.35 }}>Programmer</button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Form ──
  if (view === "form") return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/25" onClick={() => setView("list")} />
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl px-4 pt-4 animate-slide-up safe-bottom" style={{ maxHeight: "85vh", overflowY: "auto" }}>
        <div className="w-9 h-1 bg-stone-200 rounded-full mx-auto mb-3" />
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
        <button onClick={() => setView("list")} className="w-full py-2 text-[13px] text-stone-500 font-medium mt-1.5 mb-4">Annuler</button>
      </div>
    </div>
  );

  // ── Main ──
  return (
    <div className="min-h-screen bg-stone-100">
      <div className="px-5 pt-5 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-600" /><h1 className="text-[17px] font-bold tracking-tight">RoadCRM</h1></div>
        <div className="flex items-center gap-1">
          <button onClick={fetchEvents} className={`p-2 rounded-lg active:bg-stone-200 ${loading ? "animate-spin" : ""}`}><IRefresh size={16} color="#9CA3AF" /></button>
          <button onClick={() => signOut()} className="p-2 rounded-lg active:bg-stone-200"><ILogout size={16} color="#9CA3AF" /></button>
        </div>
      </div>

      {/* Calendar */}
      <div className="mx-5 mt-3 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <button onClick={prevMonth} className="p-1 rounded-lg active:bg-stone-100"><IBack size={18} color="#6B6B6B" /></button>
          <button onClick={goToday} className="text-[14px] font-semibold text-stone-800">{MONTHS_FR[calMonth]} {calYear}</button>
          <button onClick={nextMonth} className="p-1 rounded-lg active:bg-stone-100"><IFwd size={18} color="#6B6B6B" /></button>
        </div>
        <div className="grid grid-cols-7 px-2">
          {DAYS_FR.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-stone-400 py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 px-2 pb-2">
          {calDays.map(({ date, current }, i) => {
            const key = toKey(date);
            const isSel = key === selectedKey;
            const isTd = key === todayKey;
            const has = apptDates.has(key);
            return (
              <button key={i} onClick={() => setSelectedDate(new Date(date))}
                className="flex flex-col items-center py-1 rounded-xl transition-all"
                style={{ background: isSel ? "#2563EB" : "transparent", opacity: current ? 1 : 0.25 }}>
                <span className={`text-[13px] leading-none ${isSel ? "text-white font-semibold" : isTd ? "text-blue-600 font-bold" : "text-stone-700 font-medium"}`}>{date.getDate()}</span>
                <div className="h-1 mt-0.5">{has && <div className={`w-1 h-1 rounded-full mx-auto ${isSel ? "bg-white/70" : "bg-blue-500"}`} />}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date header */}
      <div className="px-5 pt-4 pb-2">
        <h2 className="text-[14px] font-semibold text-stone-800 capitalize">{selDateStr}</h2>
        <p className="text-[12px] text-stone-400 mt-0.5">{selectedAppts.length === 0 ? "Aucun rendez-vous" : `${selectedAppts.length} rendez-vous`}{isToday && " · Aujourd'hui"}</p>
      </div>

      {/* List */}
      <div className="px-5 flex flex-col gap-1.5 pb-28">
        {selectedAppts.length === 0 ? (
          <div className="text-center py-10"><p className="text-[13px] text-stone-400">Rien de prévu ce jour.</p></div>
        ) : selectedAppts.map((a) => (
          <div key={a.id} onClick={() => { setSelId(a.id); setView("detail"); }}
            className={`bg-white border border-stone-200 rounded-2xl px-4 py-3 active:bg-stone-50 shadow-sm ${a.done ? "opacity-40" : ""}`}>
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-snug">{a.name}</p>
                <p className="text-[12px] text-stone-500 mt-0.5 truncate">{a.address || "Pas d'adresse"}</p>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className="font-mono text-[12px] text-stone-500 font-medium">{a.time}</span>
                {a.address && <button onClick={(e) => { e.stopPropagation(); nav(a.address); }} className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center active:scale-95"><INav size={14} color="#fff" /></button>}
              </div>
            </div>
            {a.notes.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {a.notes.slice(-2).map((n) => <span key={n.id} className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">{n.type === "voice" ? "🎤" : "🔔"} {n.text.length > 20 ? n.text.slice(0, 20) + "…" : n.text}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={() => { setFD(selectedKey); setView("form"); }} className="fixed bottom-7 right-5 w-12 h-12 rounded-full bg-stone-900 flex items-center justify-center shadow-lg active:scale-95 z-50"><IPlus size={22} color="#fff" /></button>
    </div>
  );
}