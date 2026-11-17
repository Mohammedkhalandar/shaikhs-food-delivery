import {eventCase,resolvedEventCases} from './review-cases';
﻿import type { Prisma,Order,Role } from '@prisma/client';
import { restaurantAccess } from './restaurant-access';
const messages:Record<string,string>={PLACED:'New order received',ACCEPTED:'Your order was accepted',PREPARING:'Preparation has started',READY_FOR_PICKUP:'Your order is ready for pickup',PICKED_UP:'Your order is on its way',DELIVERED:'Order delivered',CANCELLED:'Order cancelled',RIDER_ASSIGNED:'A rider has been assigned',ACCEPT_ASSIGNMENT:'Rider accepted the assignment',REJECT_ASSIGNMENT:'Rider declined; reassignment required',CUSTOMER_UNAVAILABLE:'Customer unavailable; assistance required',ADDRESS_ISSUE:'Delivery address issue; assistance required',FAILED_DELIVERY:'Delivery unsuccessful; assistance required',RESUME_DELIVERY:'Delivery issue resolved',RETURN_CONFIRMED:'Order return confirmed',ISSUE_DELIVERY_CODE:'Delivery verification available'};
/** Called only inside the authorized business transaction. No user-supplied notification text. */
export async function notifyOrder(tx:Prisma.TransactionClient,order:Pick<Order,'id'|'orderNumber'|'customerId'|'restaurantId'|'deliveryPartnerId'>,action:string,version:number){
 if(['CUSTOMER_UNAVAILABLE','ADDRESS_ISSUE','FAILED_DELIVERY'].includes(action)){const evidence=await tx.orderOperationEvent.findFirst({where:{orderId:order.id,action},orderBy:{createdAt:'desc'}});await eventCase(tx,{orderId:order.id,kind:'DELIVERY_EXCEPTION',sourceKey:`delivery:${order.id}:${version}`,summary:'Delivery assistance required: '+action,evidence:evidence?['OPERATION:'+evidence.id]:['ORDER:'+order.id]});}
 if(['RETURN_CONFIRMED','CANCELLED'].includes(action)){const returned=await tx.order.findUniqueOrThrow({where:{id:order.id}});if(returned.paymentMethod==='ONLINE'&&returned.paymentStatus==='PAID')await eventCase(tx,{orderId:order.id,kind:'REFUND_REQUEST',sourceKey:'return-refund:'+order.id,summary:'Paid cancelled/returned order requires refund review; no refund sent'});}
 if(['RESUME_DELIVERY','RETURN_CONFIRMED'].includes(action))await resolvedEventCases(tx,order.id,'DELIVERY_EXCEPTION',action);
 const title=messages[action];if(!title)throw Error('UNSUPPORTED_NOTIFICATION_EVENT');
 const recipients=await tx.user.findMany({where:{active:true,OR:[{id:order.customerId},...(order.deliveryPartnerId?[{id:order.deliveryPartnerId}]:[]),{role:'ADMIN'},{restaurant:{id:order.restaurantId}},{staffMembership:{restaurantId:order.restaurantId,active:true,staffRole:{in:['MANAGER','KITCHEN']}}}]},select:{id:true}});
 await tx.notification.createMany({data:recipients.map(u=>({userId:u.id,orderId:order.id,eventKey:`${order.id}:${action}:${version}`,kind:'ORDER',title,body:`Order ${order.orderNumber}. Open your orders for verified details.`})),skipDuplicates:true});
}
export async function notificationScope(user:{id:string;role:Role}):Promise<Prisma.NotificationWhereInput>{
 let order:Prisma.OrderWhereInput={id:'__no_access__'};
 if(user.role==='CUSTOMER')order={customerId:user.id};else if(user.role==='DELIVERY')order={deliveryPartnerId:user.id};else if(user.role==='ADMIN')order={};else{const access=await restaurantAccess(user,'ORDERS');if(access)order={restaurantId:access.restaurant.id};}
 return {userId:user.id,OR:[{orderId:null},{order:{is:order}}]};
}
