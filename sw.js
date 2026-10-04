self.addEventListener("install", event => {
  self.skipWaiting()
})

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener("message", event => {
  const data = event.data || {}
  if (data.type === "show-reminder") {
    event.waitUntil(self.registration.showNotification("Scripture Memory", {
      body: data.body || "Time to review a verse and keep your streak.",
      tag: "scripture-reminder"
    }))
  }
})

self.addEventListener("notificationclick", event => {
  event.notification.close()
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    if (list.length > 0) return list[0].focus()
    return clients.openWindow("./")
  }))
})

self.addEventListener("periodicsync", event => {
  if (event.tag !== "scripture-reminder") return
  event.waitUntil(self.registration.showNotification("Scripture Memory", {
    body: "A verse is waiting. Open the app and keep your streak.",
    tag: "scripture-reminder"
  }))
})
