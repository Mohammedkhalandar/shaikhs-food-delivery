"use client";
import { useEffect, useId, useState } from 'react';
import type { OpeningHours } from '@/lib/operations';
export type OperationalOrder = { id:string;orderNumber:string;status:string;paymentMethod?:string;preparationMinutes?:number|null;expectedReadyAt?:string|null;riderAcceptedAt?:string|null;pickupCode?:string|null;deliveryCode?:string|null;deliveryVerificationReady?:boolean;deliveryIssue?:string|null;operationsVersion?:number;operationHistory?:{action:string;reason?:string|null;createdAt:string}[] };
async function send(path:string,method:string,body:unknown){
 const response=await fetch(path,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const data=await response.json();if(!response.ok)throw new Error(data.error??'Could not save. Refresh and retry.');return data;
}
const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export function RestaurantAvailability(){
 const [hours,setHours]=useState<OpeningHours>(days.map((_,day)=>({day,open:'09:00',close:'22:00',closed:false})));
 const [scheduled,setScheduled]=useState(false);const [open,setOpen]=useState(true);const [version,setVersion]=useState(0);
 const [pause,setPause]=useState('');const [accepting,setAccepting]=useState(false);const [until,setUntil]=useState<string|null>(null);
 const [loaded,setLoaded]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('');
 async function load(){try{const r=await fetch('/api/restaurant/status');if(!r.ok)throw new Error('Could not load kitchen settings');const {restaurant:k}=await r.json();setOpen(k.isOpen);setVersion(k.operationsVersion);setScheduled(k.weeklyHours!==null);if(k.weeklyHours)setHours(k.weeklyHours);setAccepting(k.acceptingOrders);setUntil(k.closedUntil);setLoaded(true);setError('');}catch(e){setError(e instanceof Error?e.message:'Could not load settings');}}
 useEffect(()=>{void load();},[]);
 return <section className="panel kitchen-settings" aria-label="Kitchen availability">
  <div className="panel-title"><div><h2>Kitchen hours</h2><p>Asia/Kolkata · {accepting?'Accepting orders':'Not accepting orders'}</p></div><button type="button" className="outline" onClick={()=>void load()} disabled={busy}>Reload settings</button></div>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  <details className="hours-disclosure"><summary>Operating hours and pauses</summary><form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{await send('/api/restaurant/status','PATCH',{isOpen:open,weeklyHours:scheduled?hours:null,expectedVersion:version,...(pause!==''?{closedUntil:pause==='0'?null:new Date(Date.now()+Number(pause)*60000).toISOString()}:{})});setPause('');await load();setMessage('Kitchen availability saved.');}catch(e){setError(e instanceof Error?e.message:'Could not save settings');}finally{setBusy(false);}}}>
   <fieldset disabled={!loaded||busy}><legend>Order availability</legend>
    <label className="checkline"><input type="checkbox" checked={open} onChange={e=>setOpen(e.target.checked)}/>Kitchen enabled</label>
    <label>Temporary closure<select value={pause} onChange={e=>setPause(e.target.value)}><option value="">Keep current closure</option><option value="0">Resume now</option><option value="30">Pause 30 minutes</option><option value="60">Pause 1 hour</option><option value="120">Pause 2 hours</option><option value="1440">Pause 24 hours</option></select></label>
    {until&&new Date(until)>new Date()&&<p>Paused until {new Date(until).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})} IST.</p>}
    <label className="checkline"><input type="checkbox" checked={scheduled} onChange={e=>setScheduled(e.target.checked)}/>Use weekly operating hours</label>
    {scheduled&&<div className="hours-grid">{hours.map((h,index)=><div className="hours-row" key={h.day}>
     <label className="checkline"><input type="checkbox" aria-label={`${days[h.day]} closed`} checked={h.closed} onChange={e=>setHours(old=>old.map((v,i)=>i===index?{...v,closed:e.target.checked}:v))}/>{days[h.day]} closed</label>
     <label>Opens<input type="time" aria-label={`${days[h.day]} opening time`} disabled={h.closed} value={h.open} onChange={e=>setHours(old=>old.map((v,i)=>i===index?{...v,open:e.target.value}:v))}/></label>
     <label>Closes<input type="time" aria-label={`${days[h.day]} closing time`} disabled={h.closed} value={h.close} onChange={e=>setHours(old=>old.map((v,i)=>i===index?{...v,close:e.target.value}:v))}/></label>
    </div>)}</div>}
    <p className="ops-hint">Overnight hours carry into the next day. Pausing stops new orders; existing orders still need attention.</p>
    <button className="outline" type="submit">{busy?'Saving…':'Save kitchen settings'}</button>
   </fieldset>
  </form></details>
 </section>;
}
export function OrderOperations({order,role,onRefresh}:{order:OperationalOrder;role:string;onRefresh:()=>Promise<void>}){
 const id=useId();const [reason,setReason]=useState('');const [minutes,setMinutes]=useState(30);const [code,setCode]=useState('');const [cash,setCash]=useState(false);const [issue,setIssue]=useState('CUSTOMER_UNAVAILABLE');
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function run(action:string,operation=false){if(busy)return;setBusy(true);setError('');try{await send(`/api/orders/${order.id}/${operation?'operations':'status'}`,operation?'POST':'PATCH',operation?{action,reason:reason||undefined,expectedVersion:order.operationsVersion??0}:{status:action,reason:reason||undefined,preparationMinutes:action==='ACCEPTED'?minutes:undefined,verificationCode:code||undefined,cashCollected:cash});setReason('');setCode('');await onRefresh();}catch(e){setError(e instanceof Error?e.message:'Could not update order');await onRefresh();}finally{setBusy(false);}}
 const closed=['DELIVERED','CANCELLED'].includes(order.status);
 return <div className="order-operations">
  {order.expectedReadyAt&&!closed&&<p className="ops-hint">Kitchen estimate: {new Date(order.expectedReadyAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kolkata'})} IST · {order.preparationMinutes} min</p>}
  {order.deliveryIssue&&<p className="issue-banner">Delivery paused: {order.deliveryIssue.replaceAll('_',' ').toLowerCase()}. Admin resolution required; no delivery or cash receipt recorded.</p>}
  {role==='CUSTOMER'&&order.status==='PICKED_UP'&&order.deliveryCode&&<p className="handoff-code">Delivery code <strong>{order.deliveryCode}</strong><small>Share with your rider only when your order arrives.</small></p>}
  {role==='RESTAURANT'&&order.status==='READY_FOR_PICKUP'&&order.pickupCode&&<p className="handoff-code">Pickup code <strong>{order.pickupCode}</strong><small>Share only with the assigned rider at handoff.</small></p>}
  {!closed&&['RESTAURANT','DELIVERY','ADMIN'].includes(role)&&<details className="ops-controls"><summary>{role==='RESTAURANT'?'Kitchen controls':role==='ADMIN'?'Delivery resolution':'Delivery task'}</summary>
   {error&&<p role="alert">{error}</p>}
   <fieldset disabled={busy}><legend>Order {order.orderNumber}</legend>
    {role==='RESTAURANT'&&!order.deliveryIssue&&<>
     {order.status==='PLACED'&&<><label htmlFor={id+'-prep'}>Preparation time (minutes)</label><input id={id+'-prep'} type="number" min={5} max={180} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/><button className="outline" type="button" onClick={()=>void run('ACCEPTED')}>Accept order</button></>}
     {order.status==='ACCEPTED'&&<button className="outline" type="button" onClick={()=>void run('PREPARING')}>Start preparation</button>}
     {order.status==='PREPARING'&&<button className="outline" type="button" onClick={()=>void run('READY_FOR_PICKUP')}>Ready for pickup</button>}
     {['PLACED','ACCEPTED','PREPARING','READY_FOR_PICKUP'].includes(order.status)&&<><label htmlFor={id+'-reason'}>Rejection or cancellation reason</label><textarea id={id+'-reason'} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)}/><button className="outline" type="button" disabled={reason.trim().length<3} onClick={()=>void run('CANCELLED')}>{order.status==='PLACED'?'Reject order':'Cancel with reason'}</button></>}
    </>}
    {role==='DELIVERY'&&<>
     {!order.riderAcceptedAt&&['ACCEPTED','PREPARING','READY_FOR_PICKUP'].includes(order.status)&&<><button className="outline" type="button" onClick={()=>void run('ACCEPT_ASSIGNMENT',true)}>Accept assignment</button><label htmlFor={id+'-reason'}>Assignment rejection reason</label><textarea id={id+'-reason'} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)}/><button className="outline" type="button" disabled={reason.trim().length<3} onClick={()=>void run('REJECT_ASSIGNMENT',true)}>Reject assignment</button></>}
     {order.riderAcceptedAt&&['ACCEPTED','PREPARING'].includes(order.status)&&<p>Assignment accepted. Wait for the kitchen to mark ready.</p>}
     {(order.riderAcceptedAt||(order.status==='PICKED_UP'&&!order.deliveryVerificationReady))&&['READY_FOR_PICKUP','PICKED_UP'].includes(order.status)&&!order.deliveryIssue&&<>
      {order.status==='PICKED_UP'&&!order.deliveryVerificationReady?<button className="outline" type="button" onClick={()=>void run('ISSUE_DELIVERY_CODE',true)}>Request delivery code</button>:<><label htmlFor={id+'-code'}>{order.status==='READY_FOR_PICKUP'?'Kitchen pickup code':'Customer delivery code'}</label><input id={id+'-code'} inputMode="numeric" autoComplete="off" maxLength={6} pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/>{order.status==='PICKED_UP'&&order.paymentMethod==='CASH_ON_DELIVERY'&&<label className="checkline"><input type="checkbox" checked={cash} onChange={e=>setCash(e.target.checked)}/>I collected the full COD amount</label>}<button className="outline" type="button" disabled={code.length!==6||(order.status==='PICKED_UP'&&order.paymentMethod==='CASH_ON_DELIVERY'&&!cash)} onClick={()=>void run(order.status==='READY_FOR_PICKUP'?'PICKED_UP':'DELIVERED')}>{order.status==='READY_FOR_PICKUP'?'Verify pickup':'Confirm delivery'}</button></>}
     </>}
     {order.status==='PICKED_UP'&&!order.deliveryIssue&&<><label htmlFor={id+'-issue'}>Delivery issue</label><select id={id+'-issue'} value={issue} onChange={e=>setIssue(e.target.value)}><option value="CUSTOMER_UNAVAILABLE">Customer unavailable</option><option value="ADDRESS_ISSUE">Address issue</option><option value="FAILED_DELIVERY">Failed delivery</option></select><label htmlFor={id+'-reason'}>Issue details</label><textarea id={id+'-reason'} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)}/><button className="outline" type="button" disabled={reason.trim().length<3} onClick={()=>void run(issue,true)}>Report delivery issue</button></>}
    </>}
    {role==='ADMIN'&&order.deliveryIssue&&<><label htmlFor={id+'-resolution'}>Resolution details</label><textarea id={id+'-resolution'} maxLength={300} value={reason} onChange={e=>setReason(e.target.value)}/><button className="outline" type="button" disabled={reason.trim().length<3} onClick={()=>void run('RESUME_DELIVERY',true)}>Resume delivery</button><button className="outline" type="button" disabled={reason.trim().length<3} onClick={()=>void run('RETURN_CONFIRMED',true)}>Confirm return and cancel</button></>}
    {busy&&<p role="status">Saving order update…</p>}
   </fieldset>
  </details>}
  {order.operationHistory&&order.operationHistory.length>0&&<details className="ops-history"><summary>Operational history</summary><ol>{order.operationHistory.map((event,i)=><li key={i}>{event.action.replaceAll('_',' ').toLowerCase()}{event.reason?` · ${event.reason}`:''}</li>)}</ol></details>}
 </div>;
}
