"""Runs actual generated E SQL against SQLite in memory. No user database."""
import sqlite3,json,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
for p in sorted((root/'drizzle').glob('*.sql')):db.executescript(p.read_text())
plans=json.loads((root/'work/management/plans.json').read_text())
def run(name):
 with db:
  return [db.execute(s['sql'],s['args']).rowcount for s in plans[name]]
def one(sql):return db.execute(sql).fetchone()
for i in range(500):db.execute('INSERT INTO songs(id,title,artist) VALUES(?,?,?)',('s'+str(i),'Song '+str(i),'Artist'))
db.execute("INSERT INTO sessions(id,name,created) VALUES('e','Live',1),('other','Other',2)")
db.execute("INSERT INTO settings(key,value) VALUES('active_session','\"e\"')")
db.execute("INSERT INTO session_songs(session_id,song_id) VALUES('other','s1')")
db.execute("INSERT INTO requests(id,song,song_id,session_id,name,created,client) VALUES('r','Song 1','s1','e','',1,'test')")
db.execute("INSERT INTO tips(id,session_id,song_id,provider,expected_cents,created) VALUES('t','e','s1','paypal',500,1)")
assert run('add')==[2,1]
assert run('hide')==[2,1]
assert run('stale')==[0,0]
assert run('remove')==[1,1]
assert one('SELECT count(*) FROM songs')[0]==500
assert one('SELECT count(*) FROM requests')[0]==1 and one('SELECT count(*) FROM tips')[0]==1
assert one("SELECT status FROM session_songs WHERE session_id='other'")[0]=='available'
db.execute("UPDATE session_songs SET status='playing',in_setlist=1,position=5 WHERE session_id='e'")
db.execute("UPDATE sessions SET now_song_id='s0' WHERE id='e'")
assert run('playing')==[0,0]
db.execute("UPDATE sessions SET archived=1 WHERE id='e'")
assert run('archived')==[0,0]
db.execute("UPDATE sessions SET archived=0 WHERE id='e'")
assert run('metadata')==[1] and run('metadata')==[0]
assert one("SELECT genre,decade,language,recommended FROM songs WHERE id='s1'")==('folk',1990,'pt',1)
assert run('event')==[1]
assert run('duplicateStale')==[0,0]
db.execute("INSERT INTO session_songs(session_id,song_id,status) VALUES('e','s2','hidden'),('e','s3','reserved'),('e','s4','played')")
assert run('duplicate')==[1,4]
assert one("SELECT name,date,requests_open,now_song_id,archived,venue,city,featured_title FROM sessions WHERE id='copy'")==('Next','2026-09-20',0,None,0,'Sala','Braga','Sina')
assert one("SELECT status,in_setlist,position FROM session_songs WHERE session_id='copy' AND song_id='s0'")==('available',1,5)
assert db.execute("SELECT status FROM session_songs WHERE session_id='copy' ORDER BY song_id").fetchall()==[('available',),('hidden',),('reserved',),('available',)]
assert one("SELECT value FROM settings WHERE key='active_session'")[0]=='"e"'
assert one("SELECT count(*) FROM requests WHERE session_id='copy'")[0]==0
assert one("SELECT count(*) FROM tips WHERE session_id='copy'")[0]==0
print('PASS: actual SQL; add/hide/remove, stale revisions, playing/archived guards, metadata, event context, isolated duplication, historical requests/tips/global catalogue preserved.')
