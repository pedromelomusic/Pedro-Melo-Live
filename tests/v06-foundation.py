"""SQLite in memory only. Never opens the user's database."""
import sqlite3,pathlib,re,json
root=pathlib.Path(__file__).resolve().parents[1]
db=sqlite3.connect(':memory:')
for p in sorted((root/'drizzle').glob('*.sql')):
 if p.name.startswith('0007'):continue
 db.executescript(p.read_text(encoding='utf-8'))
db.execute("INSERT INTO songs(id,title,artist,lyrics) VALUES('s','Canção','Artista','Letra autorizada')")
db.execute("INSERT INTO sessions(id,name,created) VALUES('e','Concerto',1)")
db.execute("INSERT INTO session_songs(session_id,song_id,position) VALUES('e','s',1)")
db.execute("INSERT INTO requests(id,song,song_id,session_id,name,created,client) VALUES('r','Canção','s','e','',1,'test')")
db.execute("INSERT INTO tips(id,session_id,song_id,provider,expected_cents,created) VALUES('t','e','s','paypal',500,1)")
db.execute("INSERT INTO subscriptions(id,channel,contact,session_id,created,expires,policy,token_hash) VALUES('c','email','test@example.test','e',1,999999,'v1','hash')")
tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
columns={t:[r[1] for r in db.execute('PRAGMA table_info('+t+')')] for t in tables}
before={t:db.execute('SELECT '+','.join('"'+c+'"' for c in columns[t])+' FROM '+t+' ORDER BY rowid').fetchall() for t in tables}
migration=(root/'drizzle/0007_music_context.sql').read_text(encoding='utf-8')
assert len(re.findall('ALTER TABLE',migration))==10
assert not re.search(r'\b(DROP|DELETE|UPDATE|RENAME)\b',migration,re.I)
db.executescript(migration)
for t in tables:assert before[t]==db.execute('SELECT '+','.join('"'+c+'"' for c in columns[t])+' FROM '+t+' ORDER BY rowid').fetchall(),t
assert db.execute('SELECT genre,decade,language,mood,recommended FROM songs').fetchone()==('',None,'','',0)
assert db.execute('SELECT venue,city,featured_title,featured_artist,featured_url FROM sessions').fetchone()==('','','','','')
revision=db.execute('SELECT revision FROM database_revision WHERE id=1').fetchone()[0]
db.execute("UPDATE songs SET genre='folk',decade=1990,language='pt',recommended=1 WHERE id='s'")
db.execute("UPDATE sessions SET city='Braga',featured_title='Sina',featured_artist='Pedro Melo',featured_url='https://example.test/sina' WHERE id='e'")
assert db.execute('SELECT revision FROM database_revision WHERE id=1').fetchone()[0]==revision+2
restore_source=(root/'app/backups.ts').read_text(encoding='utf-8')
for table in ['songs','sessions']:
 cols=[r[1] for r in db.execute('PRAGMA table_info('+table+')')]
 rows=[dict(zip(cols,row)) for row in db.execute('SELECT * FROM '+table)]
 match=re.search(r"insert\('"+table+r"',b\."+table+r",\[([^\]]+)\]",restore_source)
 assert match,table
 restore_cols=re.findall(r"'([^']+)'",match[1]);assert set(cols)==set(restore_cols)
 db.execute('DELETE FROM '+table)
 projection=','.join("json_extract(value,'$."+c+"')" for c in restore_cols)
 db.execute('INSERT INTO '+table+'('+','.join(restore_cols)+') SELECT '+projection+' FROM json_each(?)',(json.dumps(rows),))
 assert rows==[dict(zip(cols,row)) for row in db.execute('SELECT * FROM '+table)]
print('PASS: 10 additive columns; all existing columns/rows preserved; defaults, revision triggers and JSON restore columns verified. In-memory database only.')
