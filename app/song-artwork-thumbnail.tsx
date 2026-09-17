"use client";
import {useState} from 'react';
export function SongArtworkThumbnail({id}:{id:string}){
  const [loaded,L]=useState(false),[failed,F]=useState(false);
  if(failed)return null;
  return <img className="song-artwork-thumbnail" src={'/api/public-song-artwork?id='+encodeURIComponent(id)} width={44} height={44} alt="" aria-hidden="true" hidden={!loaded} decoding="async" onLoad={()=>L(true)} onError={()=>F(true)}/>;
}
