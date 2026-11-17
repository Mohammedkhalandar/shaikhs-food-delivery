import { notifyOrder } from '@/lib/notifications';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { visibleOrder } from '@/lib/operations';
import { jsonBody,HttpError } from '@/lib/http-body';
const schema=z.object({deliveryPartnerId:z.string().min(1)}).strict();
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const user=await currentUser();if(!user||user.role!=='ADMIN')return NextResponse.json({error:'Admin access required'},{status:403});
 try{
  const p=schema.safeParse(await jsonBody(req));if(!p.success)return NextResponse.json({error:'Choose a delivery partner'},{status:400});
  const {id}=await params;
  const result=await prisma.$transaction(async tx=>{
   const partner=await tx.user.findFirst({where:{id:p.data.deliveryPartnerId,role:'DELIVERY',active:true,deliveryProfile:{isOnline:true}}});
   if(!partner)return {error:'Online delivery partner not found',code:404};
   const order=await tx.order.findUnique({where:{id}});if(!order)return {error:'Order not found',code:404};
   if(!['READY_FOR_PICKUP','ACCEPTED','PREPARING'].includes(order.status)||order.deliveryIssue)return {error:'Order is not eligible for assignment',code:409};
   if(order.deliveryPartnerId===partner.id)return {order:visibleOrder(order,user.role)};
   const changed=await tx.order.updateMany({where:{id,status:order.status,deliveryPartnerId:order.deliveryPartnerId,operationsVersion:order.operationsVersion},data:{deliveryPartnerId:partner.id,riderAcceptedAt:null,operationsVersion:{increment:1}}});
   if(changed.count!==1)return {error:'Order changed. Refresh and retry.',code:409};
   await notifyOrder(tx,{...order,deliveryPartnerId:partner.id},'RIDER_ASSIGNED',order.operationsVersion+1);
   await tx.orderOperationEvent.create({data:{orderId:id,actorId:user.id,action:'RIDER_ASSIGNED',reason:order.deliveryPartnerId?'Reassigned before pickup':null}});
   return {order:visibleOrder(await tx.order.findUniqueOrThrow({where:{id}}),user.role)};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  return 'error' in result?NextResponse.json({error:result.error},{status:result.code}):NextResponse.json(result);
 }catch(error){return NextResponse.json({error:'Assignment unavailable. Refresh and retry.'},{status:error instanceof HttpError?error.code:error instanceof Prisma.PrismaClientKnownRequestError&&error.code==='P2034'?409:503});}
}
