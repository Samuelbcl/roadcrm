import { IHome, ISearch, INote, ISettings } from "./Icons";

export const BottomNav = ({ view, setView, notes }) => (
  <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-stone-200 safe-nav-bottom">
    <div className="flex items-center justify-around px-2 py-2.5">
      {[
        { id: "home", icon: IHome, label: "Accueil" },
        { id: "search", icon: ISearch, label: "Clients" },
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

export const SkeletonCard = () => (
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

export const SkeletonNextAppt = () => (
  <div className="mx-5 mb-3 p-3 bg-white border border-stone-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-scale-in">
    <div className="flex-1">
      <div className="skeleton h-2.5 w-16 mb-2" />
      <div className="skeleton h-4 w-32 mb-1.5" />
      <div className="skeleton h-3 w-44" />
    </div>
    <div className="skeleton w-10 h-10 rounded-full" />
  </div>
);

export const Sheet = ({ open, onClose, children }) => {
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
