import {admin,json,sameOrigin} from '../../data';
const disabled=()=>json({error:'concert_safe_disabled',message:'Restauração indisponível temporariamente em Concert Safe. / Restore temporarily unavailable in Concert Safe.'},409);
// No parsing, preview, database or R2 access before refusing restore.
export async function GET(){if(!await admin())return json({error:'forbidden'},403);return disabled();}
export async function POST(r:Request){if(!sameOrigin(r)||!await admin())return json({error:'forbidden'},403);return disabled();}
