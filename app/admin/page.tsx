import {AdminLanguage} from './language';
import {requireChatGPTUser} from '../chatgpt-auth';
import {admin} from '../data';
import Dashboard from './dashboard';
export const dynamic='force-dynamic';
export default async function Admin(){await requireChatGPTUser('/admin');if(!await admin())return <main className="admin"><a href="/">← Pedro Melo Live</a><h1>Área privada / Private area</h1><p>Acesso reservado a Pedro. / Access restricted to Pedro.</p><p>Na configuração do servidor, ADMIN_EMAIL deve corresponder ao email da conta autorizada.</p></main>;return <AdminLanguage><Dashboard/></AdminLanguage>}
