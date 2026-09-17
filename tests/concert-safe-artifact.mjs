import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
const base='2bd5e0894370aa87c31aa46e3ed8d4f6cf77691f';
const old='3a9b7a54e53a704cde568139363169b0c94503c4';
const original=p=>execFileSync('git',['show',base+':'+p]);
const files=execFileSync('git',['ls-tree','-r','--name-only',base,'drizzle'],{encoding:'utf8'}).trim().split('\n').filter(f=>/\/(?:meta\/)?000[0-6]_/.test(f));assert.equal(files.length,14);
for(const file of files){assert.deepEqual(fs.readFileSync(file),original(file),file+' unchanged');assert.deepEqual(fs.readFileSync(path.join('dist/.openai',file)),original(file),file+' packaged unchanged');}
for(const prefix of ['','dist/.openai/']){
 assert(!fs.existsSync(prefix+'drizzle/0007_music_context.sql'));assert(!fs.existsSync(prefix+'drizzle/meta/0007_snapshot.json'));
 const journal=JSON.parse(fs.readFileSync(prefix+'drizzle/meta/_journal.json','utf8'));assert.equal(journal.entries.length,7);assert.equal(journal.entries.at(-1).tag,'0006_verification');assert.deepEqual(journal.entries,JSON.parse(original('drizzle/meta/_journal.json')).entries.slice(0,7));
}
assert.deepEqual(fs.readFileSync('.openai/hosting.json'),original('.openai/hosting.json'));assert.deepEqual(fs.readFileSync('dist/.openai/hosting.json'),original('.openai/hosting.json'));
assert.equal(fs.readFileSync('db/schema.ts','utf8').replaceAll('\r\n','\n'),execFileSync('git',['show',old+':db/schema.ts'],{encoding:'utf8'}).replaceAll('\r\n','\n'));
assert.equal(execFileSync('git',['rev-parse','main'],{encoding:'utf8'}).trim(),base);
let scanned=0,sqlCount=0;const violations=[];
for(const dir of ['app','db','dist/server'])for(const relative of fs.readdirSync(dir,{recursive:true})){if(!/\.(?:tsx?|m?js)$/.test(relative))continue;const file=path.join(dir,relative),source=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);scanned++;
 function visit(node){if(ts.isStringLiteralLike(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node)){const value=node.text;if(/\b(?:SELECT|UPDATE|INSERT|ALTER|CREATE)\b/i.test(value)&&/\b(?:songs|sessions)\b/i.test(value)){sqlCount++;if(/\b(?:genre|decade|language|mood|recommended|venue|city|featured_title|featured_artist|featured_url)\b/i.test(value))violations.push({file,sql:value});}}ts.forEachChild(node,visit);}visit(ast);
}
assert.deepEqual(violations,[]);
console.log(JSON.stringify({pass:true,unchangedSQL:7,unchangedSnapshots:7,journalEnd:'0006',migration0007Absent:true,schemaMatches0006:true,hostingUnchanged:true,main:base,sourceAndBuiltFilesScanned:scanned,sqlFragmentsInspected:sqlCount,forbiddenSQL:violations},null,2));
