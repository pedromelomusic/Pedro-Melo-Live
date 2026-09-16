import {AdminLanguage} from '../language';
import {requireChatGPTUser} from '../../chatgpt-auth';
import {admin} from '../../data';
import Stage from './stage';
export const dynamic='force-dynamic';
export default async function Page(){
  await requireChatGPTUser('/admin/palco');
  if(!await admin())return <main className="admin"><h1>Área privada / Private area</h1><p>Acesso reservado a Pedro. / Access restricted to Pedro.</p></main>;
  return <AdminLanguage><Stage/></AdminLanguage>;
}
