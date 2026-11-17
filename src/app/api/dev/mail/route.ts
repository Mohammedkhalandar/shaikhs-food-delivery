import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { localMailEnabled,deliverLocalMail } from '@/lib/local-mail';
import { prisma } from '@/lib/prisma';
import { apiFailure } from '@/lib/api-failure';
async function allowed(){const user=await currentUser();return user?.role==='ADMIN'&&localMailEnabled();}
export async function GET(){if(!await allowed())return NextResponse.json({error:'Not found'},{status:404});try{return NextResponse.json({localOnly:true,message:'Local preview only. No external email sent. Use the local mail CLI to preview links.',messages:await prisma.emailOutbox.findMany({take:30,orderBy:{createdAt:'desc'},select:{id:true,recipient:true,subject:true,state:true,attempts:true,lastErrorCode:true,createdAt:true,deliveredAt:true}})},{headers:{'Cache-Control':'no-store'}});}catch(error){return apiFailure(error);}}
export async function POST(){if(!await allowed())return NextResponse.json({error:'Not found'},{status:404});try{await deliverLocalMail();return NextResponse.json({localOnly:true,message:'Due local deliveries processed; no external email sent.'});}catch(error){return apiFailure(error);}}
