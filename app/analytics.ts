// Aggregate queries only: never return contact details or visitor identifiers.
export const analyticsQueries = {
  tips: `SELECT COUNT(*) AS declared,SUM(CASE WHEN state='pending' THEN 1 ELSE 0 END) AS pending,SUM(CASE WHEN state='confirmed' THEN 1 ELSE 0 END) AS confirmed,COALESCE(SUM(CASE WHEN state IN ('confirmed','refunded') THEN received_cents-refunded_cents ELSE 0 END),0) AS netCents FROM tips WHERE session_id=?`,
  contacts: `SELECT COUNT(*) AS active,SUM(CASE WHEN EXISTS(SELECT 1 FROM contact_challenges c WHERE c.subscription_id=s.id AND c.confirmed=1) THEN 1 ELSE 0 END) AS confirmed FROM subscriptions s WHERE s.session_id=? AND s.expires>?`,
  period: `SELECT MIN(day) AS first,MAX(day) AS last FROM metrics WHERE session_id=?`
};
export function metricCounts(rows:{event:string;count:number}[]) {return Object.fromEntries(rows.map(row=>[row.event,Number(row.count)||0]));}
export function mostRequested(rows:any[]) {return rows.filter(r=>Number(r.organic)>0).sort((a,b)=>b.organic-a.organic||a.title.localeCompare(b.title)).slice(0,5);}
