// RoadCRM Service Worker — notifications RDV & rappels

let appointments = [];
let reminders = [];
let notified = new Set();

// Receive data from main app
self.addEventListener("message", (e) => {
  if (e.data.type === "SYNC_APPTS") {
    appointments = e.data.appointments || [];
  }
  if (e.data.type === "SYNC_REMINDERS") {
    reminders = e.data.reminders || [];
  }
  if (e.data.type === "CLEAR_NOTIFIED") {
    notified.clear();
  }
});

// Check every 30 seconds for upcoming appointments
function checkAppointments() {
  const now = new Date();

  // Check appointments — notify 15 min before
  appointments.forEach((a) => {
    if (a.done) return;
    const key = "appt-" + a.id;
    if (notified.has(key)) return;

    const apptTime = new Date(a.date + "T" + a.time);
    const diff = apptTime - now;
    const minutes = diff / 60000;

    if (minutes > 0 && minutes <= 15) {
      notified.add(key);
      self.registration.showNotification("RoadCRM", {
        body: "RDV dans " + Math.round(minutes) + " min : " + a.name + (a.address ? " — " + a.address : ""),
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: key,
        vibrate: [200, 100, 200],
        data: { id: a.id },
      });
    }
  });

  // Check reminders
  reminders.forEach((r) => {
    const key = "rem-" + r.id;
    if (notified.has(key)) return;

    const created = new Date(r.created_at);
    const fireAt = new Date(created.getTime() + r.delay * 60000);
    const diff = fireAt - now;

    if (diff <= 0 && diff > -60000) {
      notified.add(key);
      self.registration.showNotification("RoadCRM — Rappel", {
        body: r.text,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: key,
        vibrate: [200, 100, 200],
        data: { id: r.appointment_id },
      });
    }
  });
}

// Run check every 30 seconds
setInterval(checkAppointments, 30000);

// Also check on SW activation
self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("install", (e) => {
  e.waitUntil(self.skipWaiting());
});

// Handle notification click — open or focus the app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      if (clients.length > 0) {
        return clients[0].focus();
      }
      return self.clients.openWindow("/");
    })
  );
});
