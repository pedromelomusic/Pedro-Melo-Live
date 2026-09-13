import {live,json} from '../../data';
export async function GET(){try{return json(await live())}catch{return json({error:'unavailable'},503)}}
