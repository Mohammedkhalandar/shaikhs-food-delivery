import type { Prisma,Role } from '@prisma/client';
import { prisma } from './prisma';
export type RestaurantPermission='READ'|'MENU'|'ORDERS'|'HISTORY'|'OWNER';
export async function restaurantAccess(user:{id:string;role:Role}|null,permission:RestaurantPermission='READ',db:Prisma.TransactionClient=prisma){
 if(!user||user.role!=='RESTAURANT')return null;
 const owned=await db.restaurant.findUnique({where:{ownerId:user.id}});
 if(owned?.lifecycle==='SUSPENDED'||permission==='ORDERS'&&owned&&owned.lifecycle!=='ACTIVE')return null;
 if(owned)return {restaurant:owned,isOwner:true,staffRole:'OWNER',canMenu:true,canOrders:owned.lifecycle==='ACTIVE'};
 const membership=await db.restaurantStaff.findUnique({where:{userId:user.id},include:{restaurant:true}});
 if(!membership?.active||membership.restaurant.lifecycle==='SUSPENDED')return null;
 const canMenu=['MANAGER','MENU'].includes(membership.staffRole),hasOrderRole=['MANAGER','KITCHEN'].includes(membership.staffRole),canOrders=membership.restaurant.lifecycle==='ACTIVE'&&hasOrderRole;
 if(permission==='OWNER'||permission==='HISTORY'&&!hasOrderRole||permission==='MENU'&&!canMenu||permission==='ORDERS'&&!canOrders)return null;
 return {restaurant:membership.restaurant,isOwner:false,staffRole:membership.staffRole,canMenu,canOrders};
}
export function localDevelopment(){try{const u=new URL(process.env.DATABASE_URL??'');return ['localhost','127.0.0.1'].includes(u.hostname)&&u.pathname.startsWith('/shaikhs_disposable_');}catch{return false;}}
