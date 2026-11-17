"use client";
import {useEffect,useState} from 'react';
export function PwaStatus(){
 const [offline,setOffline]=useState(false),[waiting,setWaiting]=useState<ServiceWorker|null>(null),[message,setMessage]=useState('');
 useEffect(()=>{const online=()=>setOffline(!navigator.onLine);online();window.addEventListener('online',online);window.addEventListener('offline',online);let active=true;
   if(process.env.NODE_ENV==='production'&&'serviceWorker' in navigator){void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).then(registration=>{if(!active)return;setWaiting(registration.active?registration.waiting:null);registration.addEventListener('updatefound',()=>{const isUpdate=!!registration.active;registration.installing?.addEventListener('statechange',()=>{if(active&&isUpdate&&registration.waiting)setWaiting(registration.waiting);});});}).catch(()=>{if(active)setMessage('Offline support is unavailable. Online ordering is still available.');});}
   return()=>{active=false;window.removeEventListener('online',online);window.removeEventListener('offline',online);};
 },[]);
 if(!offline&&!waiting&&!message)return null;
 return <aside className="pwa-status" aria-label="Connection and application updates"><p role="status">{offline?'You’re offline. Reconnect before checkout or account actions.':message||'An application update is ready. Applying it will not reload your page.'}</p>{waiting&&<button type="button" className="outline" onClick={()=>{waiting.postMessage({type:'APPLY_PUBLIC_UPDATE'});setWaiting(null);setMessage('Update applied. Reload when you have finished your current action.');}}>Apply public resource update</button>}</aside>;
}
