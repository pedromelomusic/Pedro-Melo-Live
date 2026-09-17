import {AdminLanguage} from '../language';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {admin} from '../../data';
import Management from './management';
export const dynamic='force-dynamic';
export default async function Page(){await requireChatGPTUser('/admin/gestao');if(!await admin())return <main className="admin"><h1>Área privada / Private area</h1></main>;return <AdminLanguage><Management/></AdminLanguage>;}
