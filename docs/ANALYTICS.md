# Block G — aggregate event activity

Admin → Dados e ligações → O alcance deste evento uses the selected event and the
existing authenticated `/api/manage` response. No new endpoint for reading metrics.
The existing daily `metrics(day, session_id, event, count)` and retention remain.

Existing: page views, event-link opens, request counter, SocialLink clicks, consent
registrations by channel. Requests, tips and verified contact records already exist.
New instrumentation: receipt featured-original/support/community CTAs, SocialChannels,
Home/footer links, lessons/projects navigation, project selection and direct project
social CTAs. Project detail pages now record their actual path. Counters are not
backfilled. Embedded player interactions/listens are not observed.

Top five uses retained organic request counts, excluding paid votes. Tips aggregate
all rows for the exact event, including beyond the management list's 100-row limit;
unassigned tips are excluded, net receipts subtract refunds. Contact verification
counts each current subscription once even with multiple confirmed challenges.
Neither subscriptions nor consent counters represent unique people.

Metrics retain 365 days; requests 90; consent records expire and can be removed.
Displayed dates are the first/last retained metric days, UTC. These data windows differ.
No individual funnel or conversion rate: counters cannot link a person's actions.
Client events can be lost to network failures or blockers; public counters are not
fraud-proof. The pre-existing server request counter can undercount if its separate
write fails after a request is stored. Retained request ranking remains independent.
No analytics cookies, fingerprinting, personal event payloads, schema changes or
external analytics. Existing rate limiting and origin checks remain.

Checks: `node tests/v06-analytics.mjs`, `npx tsc --noEmit`, `npm run build`.
