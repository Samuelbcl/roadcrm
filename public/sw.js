// RoadCRM Service Worker — notifications RDV & rappels

let notified = new Set();
let timers = [];

function clearTimers() {
  timers.forEach((t) => clearTimeout(t));
  timers = [];
}

function scheduleNotifications(appointments, reminders) {
  clearTimers();
  const now = Date.now();

  // Schedule 15 min before each appointment
  (appointments || []).forEach((a) => {
    if (a.done) return;
    const key = "appt-" + a.id;
    if (notified.has(key)) return;

    const apptTime = new Date(a.date + "T" + a.time).getTime();
    const fireAt = apptTime - 15 * 60000; // 15 min avant
    const delay = fireAt - now;

    if (delay > 0) {
      const t = setTimeout(() => {
        notified.add(key);
        const mins = Math.round((apptTime - Date.now()) / 60000);
        self.registration.showNotification("RoadCRM", {
          body: "RDV dans " + mins + " min : " + a.name + (a.address ? " — " + a.address : ""),
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: key,
          vibrate: [200, 100, 200],
          data: { id: a.id },
        });
      }, delay);
      timers.push(t);
    } else if (delay > -15 * 60000 && !notified.has(key)) {
      // RDV is within the next 15 min already — notify now
      notified.add(key);
      const mins = Math.max(1, Math.round((apptTime - now) / 60000));
      self.registration.showNotification("RoadCRM", {
        body: "RDV dans " + mins + " min : " + a.name + (a.address ? " — " + a.address : ""),
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: key,
        vibrate: [200, 100, 200],
        data: { id: a.id },
      });
    }
  });

  // Schedule reminders
  (reminders || []).forEach((r) => {
    const key = "rem-" + r.id;
    if (notified.has(key)) return;

    const fireAt = new Date(r.created_at).getTime() + r.delay * 60000;
    const delay = fireAt - now;

    if (delay > 0) {
      const t = setTimeout(() => {
        notified.add(key);
        self.registration.showNotification("RoadCRM — Rappel", {
          body: r.text,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: key,
          vibrate: [200, 100, 200],
          data: { id: r.appointment_id },
        });
      }, delay);
      timers.push(t);
    } else if (delay > -60000) {
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

// Receive data from main app
self.addEventListener("message", (e) => {
  if (e.data.type === "SYNC_APPTS") {
    scheduleNotifications(e.data.appointments, null);
  }
  if (e.data.type === "SYNC_REMINDERS") {
    scheduleNotifications(null, e.data.reminders);
  }
  if (e.data.type === "SYNC_ALL") {
    scheduleNotifications(e.data.appointments, e.data.reminders);
  }
  if (e.data.type === "CLEAR_NOTIFIED") {
    notified.clear();
  }
});

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
