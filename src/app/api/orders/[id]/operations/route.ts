import {reverseCommission} from '@/lib/commissions';
import { notifyOrder } from '@/lib/notifications';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { visibleOrder } from '@/lib/operations';
import { HttpError,jsonBody } from '@/lib/http-body';
const schema=z.object({action:z.enum(['ACCEPT_ASSIGNMENT','REJECT_ASSIGNMENT','CUSTOMER_UNAVAILABLE','ADDRESS_ISSUE','FAILED_DELIVERY','RESUME_DELIVERY','RETURN_CONFIRMED','ISSUE_DELIVERY_CODE']),reason:z.string().trim().min(3).max(300).optional(),expectedVersion:z.number().int().nonnegative()}).strict();
export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await currentUser();if(!user||!['DELIVERY','ADMIN'].includes(user.role))return NextResponse.json({error:'Forbidden'},{status:403});
 try{
  const p=schema.safeParse(await jsonBody(req));if(!p.success)return NextResponse.json({error:'Invalid operation details'},{status:400});
  const {id}=await params;const {action,reason,expectedVersion}=p.data;
  const result=await prisma.$transaction(async tx=>{
   const order=await tx.order.findUnique({where:{id}});if(!order)return {error:'Order not found',code:404};
   if(user.role==='DELIVERY'&&order.deliveryPartnerId!==user.id)return {error:'Forbidden',code:403};
   if(expectedVersion!==order.operationsVersion)return {error:'Order changed. Refresh and retry.',code:409};
   if(['DELIVERED','CANCELLED'].includes(order.status))return {error:'Order is already closed',code:409};
   const data:Prisma.OrderUncheckedUpdateManyInput={operationsVersion:{increment:1}};
   if(action==='ACCEPT_ASSIGNMENT'||action==='REJECT_ASSIGNMENT'){
    if(user.role!=='DELIVERY')return {error:'Only the assigned rider can respond',code:403};
    if(!['ACCEPTED','PREPARING','READY_FOR_PICKUP'].includes(order.status)||order.riderAcceptedAt||order.deliveryIssue)return {error:'Assignment is no longer pending',code:409};
    if(action==='ACCEPT_ASSIGNMENT'){
     const profile=await tx.deliveryProfile.findUnique({where:{userId:user.id}});if(!profile?.isOnline)return {error:'Go online before accepting an assignment',code:409};
     data.riderAcceptedAt=new Date();
     if(order.status==='READY_FOR_PICKUP'&&!order.pickupCode)data.pickupCode=String(randomInt(100000,1000000));
    }else{
     if(!reason)return {error:'A rejection reason is required',code:400};
     data.deliveryPartnerId=null;data.riderAcceptedAt=null;
    }
   }else if(action==='RESUME_DELIVERY'||action==='RETURN_CONFIRMED'){
    if(user.role!=='ADMIN')return {error:'Admin resolution required',code:403};
    if(!order.deliveryIssue||!reason)return {error:'Choose an open issue and provide a resolution reason',code:409};
    data.deliveryIssue=null;
    if(action==='RETURN_CONFIRMED'){
     if(order.status!=='PICKED_UP')return {error:'Only picked-up orders can be returned',code:409};
     data.status='CANCELLED';
    }
   }else if(action==='ISSUE_DELIVERY_CODE'){
    if(user.role!=='DELIVERY'||order.status!=='PICKED_UP'||order.deliveryCode)return {error:'Delivery verification is already available or not applicable',code:409};
    data.deliveryCode=String(randomInt(100000,1000000));
    if(!order.riderAcceptedAt)data.riderAcceptedAt=new Date(); // Audited recovery for an already-picked-up legacy assignment.
   }else{
    if(user.role!=='DELIVERY'||!order.riderAcceptedAt||order.status!=='PICKED_UP'||order.deliveryIssue)return {error:'An accepted, picked-up assignment without an open issue is required',code:409};
    if(!reason)return {error:'Describe the delivery issue',code:400};
    data.deliveryIssue=action;
   }
   const changed=await tx.order.updateMany({where:{id,status:order.status,deliveryPartnerId:order.deliveryPartnerId,operationsVersion:expectedVersion},data});
   if(changed.count!==1)return {error:'Order changed. Refresh and retry.',code:409};
   await tx.orderOperationEvent.create({data:{orderId:id,actorId:user.id,action,reason}});
   if(action==='RETURN_CONFIRMED'){
    await reverseCommission(tx,id,'CANCELLED',user.id);
    await tx.orderStatusEvent.create({data:{orderId:id,actorId:user.id,status:'CANCELLED',note:reason}});
    if(order.paymentMethod==='ONLINE'&&order.paymentStatus==='PAID'){
     const payment=await tx.onlinePayment.findUnique({where:{orderId:id}});
     if(payment)await tx.paymentAudit.create({data:{paymentId:payment.id,actorId:user.id,action:'CANCELLED_REFUND_REQUIRED'}});
    }
   }
   const updated=await tx.order.findUniqueOrThrow({where:{id}});
   await notifyOrder(tx,updated,action,updated.operationsVersion);
   return {order:visibleOrder(updated,user.role)};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return 'error' in result?NextResponse.json({error:result.error},{status:result.code}):NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});
 }catch(error){return NextResponse.json({error:'Operation changed or unavailable. Refresh and retry.'},{status:error instanceof HttpError?error.code:error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2034'?409:503});}
}
