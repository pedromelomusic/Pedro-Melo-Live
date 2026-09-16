"""Exercise the actual public-song SELECT using synthetic in-memory SQLite only."""
import re, sqlite3, time
from pathlib import Path
source=Path('app/data.ts').read_text()
query=re.search(r'prepare\("(SELECT s.id,s.title,s.artist,s.genre.*?)"\)\.bind\(id,id\)',source).group(1)
db=sqlite3.connect(':memory:')
db.executescript('CREATE TABLE songs(id TEXT PRIMARY KEY,title TEXT,artist TEXT,genre TEXT,decade INTEGER,language TEXT); CREATE TABLE session_songs(session_id TEXT,song_id TEXT,status TEXT,PRIMARY KEY(session_id,song_id)); CREATE TABLE requests(id TEXT,session_id TEXT,song_id TEXT,created INTEGER); CREATE INDEX requests_session_created_id ON requests(session_id,created,id);')
db.executemany('INSERT INTO songs VALUES(?,?,?,?,?,?)',[(str(i),'Song '+str(i),'Artist','Folk',1990,'en') for i in range(501)])
db.executemany('INSERT INTO session_songs VALUES(?,?,?)',[('event',str(i),'available' if i<498 else 'hidden' if i==498 else 'reserved') for i in range(500)])
db.executemany('INSERT INTO requests VALUES(?,?,?,?)',[(str(i),'event',str(i%500),i) for i in range(5000)]+[('other','other','0',0)])
start=time.perf_counter();rows=db.execute(query,('event','event')).fetchall();elapsed=(time.perf_counter()-start)*1000
assert len(rows)==499 and '498' not in [r[0] for r in rows] and '500' not in [r[0] for r in rows]
assert all(r[-1]==10 for r in rows)
assert all(r[3:6]==('Folk',1990,'en') for r in rows)
assert not db.execute(query,('missing','missing')).fetchall()
plan=db.execute('EXPLAIN QUERY PLAN '+query,('event','event')).fetchall()
assert any('requests_session_created_id' in str(row) for row in plan)
print(f'PASS public query: 500 event songs, 5000 requests, metadata, event isolation, hidden/catalog-only exclusion, real counts, existing request index; {elapsed:.2f} ms (local SQLite).')
