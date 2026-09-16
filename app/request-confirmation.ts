export type SongRequest = {id:string; sessionId:string; songId:string; name:string; website:string};
export class RequestNotConfirmed extends Error {
  constructor(public code: string) { super(code); }
}
// The timeout covers both transport and response-body parsing. Keep the same
// request id after any uncertain result: the existing API deduplicates retries.
export async function confirmSongRequest(payload: SongRequest, transport: typeof fetch = fetch, timeoutMs = 15000) {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      (async () => {
        const response = await transport('/api/requests', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload), signal:controller.signal});
        let body: unknown;
        try { body = await response.json(); } catch { throw new RequestNotConfirmed('ambiguous'); }
        const result = body as {ok?:unknown; error?:unknown} | null;
        if (!response.ok) throw new RequestNotConfirmed(typeof result?.error === 'string' ? result.error : 'server');
        if (result?.ok !== true) throw new RequestNotConfirmed('ambiguous');
      })(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => { reject(new RequestNotConfirmed('timeout')); controller.abort(); }, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
}
