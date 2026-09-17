"use client";
import {useState} from 'react';
import type {PhotoSlot} from './photography';
export function ProjectPhoto({slot,alt}:{slot:PhotoSlot;alt:string}) {
  const [loaded,L]=useState(false),[failed,F]=useState(false);
  if(failed)return null;
  return <img className={'project-photo photo-'+slot} src={'/api/public-project-photo?slot='+slot} alt={alt} loading="lazy" hidden={!loaded} onLoad={()=>L(true)} onError={()=>F(true)}/>;
}
