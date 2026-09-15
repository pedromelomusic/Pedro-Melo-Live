import {json} from '../../data';
import {siteContent} from '../../content';
export async function GET(){try{return json(await siteContent())}catch{return json({error:'unavailable'},503)}}
