import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it,vi } from 'vitest';
const mocks=vi.hoisted(()=>({actor:null as {id:string;role:string}|null}));
vi.mock('@/lib/auth',()=>({currentUser:async()=>mocks.actor}));
vi.mock('@/lib/prisma',async()=>{const {PrismaClient}=await import('@prisma/client');return {prisma:new PrismaClient({datasourceUrl:process.env.TEST_DATABASE_URL||'postgresql://disabled@127.0.0.1:1/shaikhs_disposable_disabled'})};});
import { prisma } from '@/lib/prisma';
import { PATCH as status } from '@/app/api/orders/[id]/status/route';
import { POST as operation } from '@/app/api/orders/[id]/operations/route';
import { PATCH as assign } from '@/app/api/admin/orders/[id]/assign/route';
import { POST as settle } from '@/app/api/admin/orders/[id]/settle/route';
import { PATCH as availability } from '@/app/api/restaurant/status/route';
import { POST as checkout,GET as list } from '@/app/api/orders/route';
const suite=process.env.TEST_DATABASE_URL?describe:describe.skip;
const run=randomUUID();let restaurantId:string;
let owner:{id:string;role:string},customer:typeof owner,rider:typeof owner,admin:typeof owner,outsider:typeof owner;
function call(handler:typeof status|typeof operation|typeof assign|typeof settle,actor:typeof owner,id:string,body:unknown){mocks.actor=actor;return handler(new Request('http://localhost/api',{method:handler===status||handler===assign?'PATCH':'POST',body:JSON.stringify(body)}),{params:Promise.resolve({id})});}
async function fixture(){return prisma.order.create({data:{orderNumber:`OPS-${randomUUID()}`,customerId:customer.id,restaurantId,status:'PLACED',paymentMethod:'CASH_ON_DELIVERY',subtotal:100,deliveryFee:35,tax:5,total:140,deliveryAddress:'Synthetic operations road',statusHistory:{create:{status:'PLACED',actorId:customer.id}}}});}
async function get(id:string){return prisma.order.findUniqueOrThrow({where:{id}});}
async function op(id:string,actor:typeof owner,action:string,reason?:string,version?:number){return call(operation,actor,id,{action,reason,expectedVersion:version??(await get(id)).operationsVersion});}
async function ready(){const o=await fixture();for(const stage of ['ACCEPTED','PREPARING','READY_FOR_PICKUP'])expect((await call(status,owner,o.id,{status:stage,preparationMinutes:25})).status).toBe(200);expect((await call(assign,admin,o.id,{deliveryPartnerId:rider.id})).status).toBe(200);return get(o.id);}
async function picked(){const o=await ready();expect((await op(o.id,rider,'ACCEPT_ASSIGNMENT')).status).toBe(200);expect((await call(status,rider,o.id,{status:'PICKED_UP',verificationCode:o.pickupCode})).status).toBe(200);return get(o.id);}
suite('real PostgreSQL restaurant and rider operations (synthetic data, no provider)',()=>{
 beforeAll(async()=>{
  const u=new URL(process.env.TEST_DATABASE_URL!);if(!['localhost','127.0.0.1'].includes(u.hostname)||!u.pathname.startsWith('/shaikhs_disposable_'))throw Error('Disposable local database required');
  const actors=[];for(const role of ['RESTAURANT','CUSTOMER','DELIVERY','ADMIN','RESTAURANT'] as const)actors.push(await prisma.user.create({data:{name:`Ops fixture ${role}`,email:`ops-${randomUUID()}@example.test`,role,passwordHash:'invalid-fixture-hash',...(role==='DELIVERY'?{deliveryProfile:{create:{isOnline:true}}}:{})}}));
  [owner,customer,rider,admin,outsider]=actors;
  restaurantId=(await prisma.restaurant.create({data:{ownerId:owner.id,name:`Operations ${run}`,address:'Synthetic kitchen road'}})).id;
 await prisma.deliveryZone.create({data:{restaurantId,name:'Synthetic postal service area',postalCode:'584101',deliveryFee:'35.00',minimumOrder:0}});

 });
 afterAll(()=>prisma.$disconnect());
 it('persists temporary closure and prevents checkout without editing existing records',async()=>{
  mocks.actor=owner;const old=await prisma.restaurant.findUniqueOrThrow({where:{id:restaurantId}});
  expect((await availability(new Request('http://localhost',{method:'PATCH',body:JSON.stringify({closedUntil:new Date(Date.now()+600000).toISOString(),expectedVersion:old.operationsVersion})}))).status).toBe(200);
  mocks.actor=customer;const r=await checkout(new Request('http://localhost',{method:'POST',headers:{'Idempotency-Key':`closure-${run}`},body:JSON.stringify({restaurantId,postalCode:'584101',deliveryAddress:'Synthetic closed address',items:[{productId:'unused-closed-fixture',quantity:1}]})}));expect(r.status).toBe(409);
  mocks.actor=owner;expect((await availability(new Request('http://localhost',{method:'PATCH',body:JSON.stringify({isOpen:false,expectedVersion:old.operationsVersion})}))).status).toBe(409);
  expect((await availability(new Request('http://localhost',{method:'PATCH',body:JSON.stringify({closedUntil:null})}))).status).toBe(200);
 });
 it('requires rejection reason and persists preparation estimates',async()=>{
  const o=await fixture();expect((await call(status,owner,o.id,{status:'CANCELLED'})).status).toBe(400);
  expect((await call(status,outsider,o.id,{status:'ACCEPTED'})).status).toBe(403);
  expect((await call(status,owner,o.id,{status:'ACCEPTED',preparationMinutes:0})).status).toBe(400);
  expect((await call(status,owner,o.id,{status:'ACCEPTED',preparationMinutes:45})).status).toBe(200);
  const accepted=await get(o.id);expect(accepted.preparationMinutes).toBe(45);expect(accepted.expectedReadyAt!.getTime()).toBeGreaterThan(Date.now()+44*60000);
  expect((await call(status,owner,o.id,{status:'CANCELLED',reason:'Ingredient unavailable'})).status).toBe(200);
  expect((await prisma.orderStatusEvent.findFirstOrThrow({where:{orderId:o.id,status:'CANCELLED'}})).note).toBe('Ingredient unavailable');
 });
 it('persists weekly hours, rejects malformed schedules and denies another role',async()=>{
  const hours=Array.from({length:7},(_,day)=>({day,open:'09:00',close:'22:00',closed:true}));
  mocks.actor=owner;expect((await availability(new Request('http://localhost',{method:'PATCH',body:JSON.stringify({weeklyHours:hours})}))).status).toBe(200);
  expect((await prisma.restaurant.findUniqueOrThrow({where:{id:restaurantId}})).weeklyHours).toEqual(hours);
  expect((await availability(new Request('http://localhost',{method:'PATCH',body:JSON.stringify({weeklyHours:hours.slice(1)})}))).status).toBe(400);
  mocks.actor=rider;expect((await availability(new Request('http://localhost',{method:'PATCH',body:JSON.stringify({isOpen:false})}))).status).toBe(403);
  mocks.actor=owner;expect((await availability(new Request('http://localhost',{method:'PATCH',body:JSON.stringify({weeklyHours:null})}))).status).toBe(200);
 });
 it('requires rider acceptance, online status and a rejection reason',async()=>{
  const o=await ready();expect((await call(status,rider,o.id,{status:'PICKED_UP',verificationCode:o.pickupCode})).status).toBe(409);
  expect((await op(o.id,rider,'REJECT_ASSIGNMENT')).status).toBe(400);
  await prisma.deliveryProfile.update({where:{userId:rider.id},data:{isOnline:false}});
  expect((await op(o.id,rider,'ACCEPT_ASSIGNMENT')).status).toBe(409);
  await prisma.deliveryProfile.update({where:{userId:rider.id},data:{isOnline:true}});
  expect((await op(o.id,rider,'REJECT_ASSIGNMENT','Vehicle issue')).status).toBe(200);
  expect((await get(o.id)).deliveryPartnerId).toBeNull();
  expect(await prisma.orderOperationEvent.count({where:{orderId:o.id,action:'REJECT_ASSIGNMENT'}})).toBe(1);
 });
 it('requires independent handoff codes and COD collection, without marking revenue paid',async()=>{
  const o=await ready();expect((await op(o.id,customer,'ACCEPT_ASSIGNMENT')).status).toBe(403);
  expect((await op(o.id,rider,'ACCEPT_ASSIGNMENT')).status).toBe(200);
  expect((await op(o.id,rider,'ACCEPT_ASSIGNMENT')).status).toBe(409);
  expect((await call(status,rider,o.id,{status:'PICKED_UP',verificationCode:'000000'})).status).toBe(422);
  expect((await call(status,rider,o.id,{status:'PICKED_UP',verificationCode:o.pickupCode})).status).toBe(200);
  const p=await get(o.id);expect(p.deliveryCode).toMatch(/^\d{6}$/);
  mocks.actor=rider;const riderOrder=(await (await list()).json()).orders.find((v:{id:string})=>v.id===o.id);expect(riderOrder.pickupCode).toBeUndefined();expect(riderOrder.deliveryCode).toBeUndefined();
  mocks.actor=customer;const customerOrder=(await (await list()).json()).orders.find((v:{id:string})=>v.id===o.id);expect(customerOrder.pickupCode).toBeUndefined();expect(customerOrder.deliveryCode).toBe(p.deliveryCode);
  expect((await call(status,rider,o.id,{status:'DELIVERED',verificationCode:p.deliveryCode})).status).toBe(400);
  expect((await call(status,rider,o.id,{status:'DELIVERED',verificationCode:'000000',cashCollected:true})).status).toBe(422);
  expect((await call(status,rider,o.id,{status:'DELIVERED',verificationCode:p.deliveryCode,cashCollected:true})).status).toBe(200);
  expect((await get(o.id)).paymentStatus).toBe('PENDING');expect(await prisma.codSettlement.count({where:{orderId:o.id}})).toBe(0);
  expect(await prisma.orderOperationEvent.count({where:{orderId:o.id,action:'COD_COLLECTION_CONFIRMED'}})).toBe(1);
  expect((await call(settle,rider,o.id,{amount:'140.00',reference:`ops-receipt-${o.id}`})).status).toBe(403);
  expect((await call(settle,admin,o.id,{amount:'140.00',reference:`ops-receipt-${o.id}`})).status).toBe(200);
  expect((await get(o.id)).paymentStatus).toBe('PAID');
 });
 it.each(['CUSTOMER_UNAVAILABLE','ADDRESS_ISSUE','FAILED_DELIVERY'])('holds %s until an authorized resolution',async issue=>{
  const o=await picked();expect((await op(o.id,rider,issue,'Attempted contact at delivery location')).status).toBe(200);
  expect((await call(status,rider,o.id,{status:'DELIVERED',verificationCode:o.deliveryCode,cashCollected:true})).status).toBe(409);
  expect((await op(o.id,rider,'RESUME_DELIVERY','Please retry')).status).toBe(403);
  expect((await op(o.id,admin,'RESUME_DELIVERY','Customer confirmed corrected details')).status).toBe(200);
  expect((await get(o.id)).deliveryIssue).toBeNull();expect((await get(o.id)).paymentStatus).toBe('PENDING');
 });
 it('confirms a failed return without inventing delivery or cash revenue',async()=>{
  const o=await picked();expect((await op(o.id,rider,'FAILED_DELIVERY','Customer declined the delivery')).status).toBe(200);
  expect((await op(o.id,admin,'RETURN_CONFIRMED','Kitchen confirmed the returned package')).status).toBe(200);
  expect((await get(o.id)).status).toBe('CANCELLED');expect((await get(o.id)).paymentStatus).toBe('PENDING');
  expect((await call(settle,admin,o.id,{amount:'140.00',reference:`bad-return-${o.id}`})).status).toBe(409);
  expect(await prisma.codSettlement.count({where:{orderId:o.id}})).toBe(0);
 });
 it('allows one assignment response under concurrent duplicate requests',async()=>{
  const o=await ready();const results=await Promise.all([op(o.id,rider,'ACCEPT_ASSIGNMENT',undefined,o.operationsVersion),op(o.id,rider,'ACCEPT_ASSIGNMENT',undefined,o.operationsVersion)]);
  expect(results.map(r=>r.status).sort()).toEqual([200,409]);expect(await prisma.orderOperationEvent.count({where:{orderId:o.id,action:'ACCEPT_ASSIGNMENT'}})).toBe(1);
 });
 it('bounds verification guessing per actor/order',async()=>{
  const o=await ready();expect((await op(o.id,rider,'ACCEPT_ASSIGNMENT')).status).toBe(200);
  for(let i=0;i<5;i++)expect((await call(status,rider,o.id,{status:'PICKED_UP',verificationCode:'000000'})).status).toBe(422);
  expect((await call(status,rider,o.id,{status:'PICKED_UP',verificationCode:o.pickupCode})).status).toBe(429);
  expect((await get(o.id)).status).toBe('READY_FOR_PICKUP');
 });
 it('recovers a pre-migration picked-up assignment without exposing the customer code to its rider',async()=>{
  const o=await fixture();await prisma.order.update({where:{id:o.id},data:{status:'PICKED_UP',deliveryPartnerId:rider.id}});
  const response=await op(o.id,rider,'ISSUE_DELIVERY_CODE');expect(response.status).toBe(200);
  expect((await response.json()).order.deliveryCode).toBeUndefined();expect((await get(o.id)).deliveryCode).toMatch(/^\d{6}$/);expect((await get(o.id)).riderAcceptedAt).not.toBeNull();
  expect((await op(o.id,rider,'ISSUE_DELIVERY_CODE')).status).toBe(409);
 });
});
