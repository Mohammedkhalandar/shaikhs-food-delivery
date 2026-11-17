import {restoreStock} from '@/lib/inventory';
import {reverseCommission} from '@/lib/commissions';
import { notifyOrder } from '@/lib/notifications';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomInt, timingSafeEqual } from 'node:crypto';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canTransition } from '@/lib/order';
import { visibleOrder } from '@/lib/operations';
import { jsonBody, HttpError } from '@/lib/http-body';
import { rateLimit } from '@/lib/rate-limit';
import { restaurantAccess } from '@/lib/restaurant-access';
import { recordEarning } from '@/lib/earnings';
const schema=z.object({status:z.enum(['ACCEPTED','PREPARING','READY_FOR_PICKUP','PICKED_UP','DELIVERED','CANCELLED']),reason:z.string().trim().min(3).max(300).optional(),preparationMinutes:z.number().int().min(5).max(180).optional(),verificationCode:z.string().regex(/^\d{6}$/).optional(),cashCollected:z.boolean().optional()}).strict();
const codeMatches=(stored:string|null,input?:string)=>Boolean(stored&&input&&stored.length===input.length&&timingSafeEqual(Buffer.from(stored),Buffer.from(input)));
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await currentUser();if(!user)return NextResponse.json({error:'Sign in required'},{status:401});
 try{
 const parsed=schema.safeParse(await jsonBody(req));if(!parsed.success)return NextResponse.json({error:'Invalid status details'},{status:400});
 const {id}=await params;const {status:next,reason,preparationMinutes,verificationCode,cashCollected}=parsed.data;
 const result=await prisma.$transaction(async tx=>{
  const order=await tx.order.findUnique({where:{id}});if(!order)return {error:'Order not found',code:404};
  const allowed=user.role==='ADMIN'||(user.role==='CUSTOMER'&&next==='CANCELLED')||(user.role==='RESTAURANT'&&['ACCEPTED','PREPARING','READY_FOR_PICKUP','CANCELLED'].includes(next))||(user.role==='DELIVERY'&&['PICKED_UP','DELIVERED'].includes(next));
  if(!allowed)return {error:'Forbidden',code:403};
  if(user.role==='CUSTOMER'){
   if(order.customerId!==user.id)return {error:'Forbidden',code:403};
   if(order.status!=='PLACED')return {error:'Restaurant has already responded. Contact the restaurant for help.',code:409};
  }
  if(user.role==='RESTAURANT'){
   const access=await restaurantAccess(user,'ORDERS',tx);
   if(access?.restaurant.id!==order.restaurantId)return {error:'Forbidden',code:403};
  }
  if(user.role==='DELIVERY'&&order.deliveryPartnerId!==user.id)return {error:'Forbidden',code:403};
  if(!canTransition(order.status,next))return {error:'Invalid order status transition',code:409};
  if(next==='CANCELLED'&&user.role!=='CUSTOMER'&&!reason)return {error:'A rejection or cancellation reason is required',code:400};
  if(order.deliveryIssue)return {error:'Resolve the delivery issue before changing this order',code:409};
  if(order.paymentMethod==='ONLINE'&&order.paymentStatus!=='PAID'&&next!=='CANCELLED')return {error:'Online payment must be captured before preparation or delivery',code:409};
  if(['PICKED_UP','DELIVERED'].includes(next)){
   if(!order.deliveryPartnerId||!order.riderAcceptedAt)return {error:'The assigned rider must accept the assignment first',code:409};
   if(!await rateLimit('handoff-code',`${id}:${user.id}`,5,900))return {error:'Too many verification attempts. Try again in 15 minutes.',code:429};
   if(!codeMatches(next==='PICKED_UP'?order.pickupCode:order.deliveryCode,verificationCode))return {error:next==='PICKED_UP'?'Ask the kitchen for the pickup code':'Ask the customer for the delivery code',code:422};
   if(next==='DELIVERED'&&order.paymentMethod==='CASH_ON_DELIVERY'&&cashCollected!==true)return {error:'Confirm cash was collected before completing COD delivery',code:400};
  }
  const minutes=preparationMinutes??30;
  const changed=await tx.order.updateMany({where:{id,status:order.status,deliveryPartnerId:order.deliveryPartnerId,paymentStatus:order.paymentStatus,operationsVersion:order.operationsVersion},data:{status:next,operationsVersion:{increment:1},...(next==='ACCEPTED'?{preparationMinutes:minutes,expectedReadyAt:new Date(Date.now()+minutes*60000)}:{}),...(next==='READY_FOR_PICKUP'?{pickupCode:String(randomInt(100000,1000000))}:{}),...(next==='PICKED_UP'?{deliveryCode:String(randomInt(100000,1000000))}:{})}});
  if(changed.count!==1)return {error:'Order changed. Refresh and retry.',code:409};
  if(next==='CANCELLED'){await restoreStock(tx,id,order.status,user.id,'Cancellation before kitchen acceptance');await reverseCommission(tx,id,'CANCELLED',user.id);}
  if(next==='DELIVERED')await recordEarning(tx,order);
  await tx.orderStatusEvent.create({data:{orderId:id,status:next,actorId:user.id,...(reason?{note:reason}:{})}});
  if(next==='DELIVERED'&&order.paymentMethod==='CASH_ON_DELIVERY')await tx.orderOperationEvent.create({data:{orderId:id,actorId:user.id,action:'COD_COLLECTION_CONFIRMED'}});
  if(next==='CANCELLED'&&order.paymentMethod==='ONLINE'&&order.paymentStatus==='PAID'){
   const payment=await tx.onlinePayment.findUnique({where:{orderId:id},select:{id:true}});
   if(payment)await tx.paymentAudit.create({data:{paymentId:payment.id,action:'CANCELLED_REFUND_REQUIRED',actorId:user.id}});
  }
  await notifyOrder(tx,order,next,order.operationsVersion+1);
  return {order:visibleOrder((await tx.order.findUnique({where:{id}}))!,user.role)};
 });
 return 'error' in result?NextResponse.json({error:result.error},{status:result.code}):NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:'Unable to update order. Refresh and retry.'},{status:error instanceof HttpError?error.code:503});}
}
