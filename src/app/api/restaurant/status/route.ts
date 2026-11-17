import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { currentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hoursSchema, restaurantAvailable } from '@/lib/operations';
import { jsonBody, HttpError } from '@/lib/http-body';
const schema = z.object({ isOpen: z.boolean().optional(), weeklyHours: hoursSchema.nullable().optional(), closedUntil: z.string().datetime().nullable().optional(), expectedVersion: z.number().int().nonnegative().optional() }).strict().refine(b => b.isOpen !== undefined || b.weeklyHours !== undefined || b.closedUntil !== undefined);
export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== 'RESTAURANT') return NextResponse.json({ error:'Forbidden' }, {status:403});
  const restaurant = await prisma.restaurant.findUnique({where:{ownerId:user.id},select:{id:true,isOpen:true,weeklyHours:true,closedUntil:true,operationsVersion:true,lifecycle:true,owner:{select:{active:true}}}});
  if (!restaurant) return NextResponse.json({error:'Restaurant profile not found'},{status:404});
  return NextResponse.json({restaurant:{...restaurant,acceptingOrders:restaurantAvailable(restaurant),timeZone:'Asia/Kolkata'}},{headers:{'Cache-Control':'no-store'}});
}
export async function PATCH(req:Request) {
  const user = await currentUser();
  if (!user || user.role !== 'RESTAURANT') return NextResponse.json({error:'Forbidden'},{status:403});
  try {
    const parsed = schema.safeParse(await jsonBody(req));
    if (!parsed.success) return NextResponse.json({error:'Invalid availability or weekly hours'},{status:400});
    const old = await prisma.restaurant.findUnique({where:{ownerId:user.id}});
    if (!old) return NextResponse.json({error:'Restaurant profile not found'},{status:404});
    if(old.lifecycle==='SUSPENDED')return NextResponse.json({error:'Restaurant is suspended. Contact the administrator.'},{status:403});
    const {expectedVersion,weeklyHours,closedUntil,isOpen} = parsed.data;
    if (expectedVersion !== undefined && expectedVersion !== old.operationsVersion) return NextResponse.json({error:'Settings changed. Reload before saving.'},{status:409});
    if (closedUntil && (new Date(closedUntil) <= new Date() || new Date(closedUntil).getTime() > Date.now()+7*86400000)) return NextResponse.json({error:'Temporary closure must end within seven days'},{status:400});
    const changed = await prisma.restaurant.updateMany({where:{id:old.id,operationsVersion:old.operationsVersion},data:{isOpen,weeklyHours:weeklyHours === null ? Prisma.DbNull : weeklyHours,closedUntil:closedUntil === undefined ? undefined : closedUntil === null ? null : new Date(closedUntil),operationsVersion:{increment:1}}});
    if(changed.count!==1) return NextResponse.json({error:'Settings changed. Reload before saving.'},{status:409});
    const restaurant=await prisma.restaurant.findUniqueOrThrow({where:{id:old.id}});
    return NextResponse.json({restaurant:{...restaurant,acceptingOrders:restaurantAvailable(restaurant),timeZone:'Asia/Kolkata'}});
  } catch(error) { return NextResponse.json({error:'Could not save availability'},{status:error instanceof HttpError?error.code:503}); }
}
