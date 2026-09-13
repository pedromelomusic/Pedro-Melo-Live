import type { Metadata } from 'next';
import './globals.css';
import Enhancements from './enhancements';
export const metadata:Metadata={title:'Pedro Melo Live — A próxima música é contigo',description:'Pede uma música e descobre o universo de Pedro Melo. Request a song and discover Pedro Melo.',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt"><body>{children}<Enhancements/></body></html>}
