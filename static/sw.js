self.addEventListener('push', (event) => {
    let data = {};
    try {
        data = event.data ? event.data.json() : {};
    } catch (e) {
        try {
            data = { body: event.data ? event.data.text() : '' };
        } catch {
            data = {};
        }
    }

    const title = (data && data.title) ? String(data.title) : 'EduPortal';
    const body = (data && data.body) ? String(data.body) : '';
    const url = (data && data.url) ? String(data.url) : '/chat';

    const options = {
        body,
        data: { url },
        tag: (data && data.kind && data.message_id) ? `${data.kind}:${data.message_id}` : undefined,
        renotify: true,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = (event.notification && event.notification.data && event.notification.data.url)
        ? String(event.notification.data.url)
        : '/chat';

    event.waitUntil(
        (async () => {
            const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
            for (const client of allClients) {
                if (client.url && client.url.includes(url)) {
                    await client.focus();
                    return;
                }
            }
            await self.clients.openWindow(url);
        })()
    );
});
