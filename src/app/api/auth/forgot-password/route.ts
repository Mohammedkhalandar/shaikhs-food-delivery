import { NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { jsonBody } from '@/lib/http-body';
import { rateLimit } from '@/lib/rate-limit';
import { requestRecovery } from '@/lib/recovery';
import { apiFailure } from '@/lib/api-failure';
const schema=z.object({email:z.email().max(254)}).strict();
export async function POST(req:Request){const start=Date.now();try{const p=schema.safeParse(await jsonBody(req));if(!p.success)return NextResponse.json({error:'Enter a valid email address.'},{status:400});const email=p.data.email.toLowerCase();const global=await rateLimit('recovery-global','all',60,60),account=await rateLimit('recovery-account',email,5);if(global&&account)await requestRecovery(email);return NextResponse.json({message:'If this account is eligible, recovery instructions will be available through the configured delivery method.'},{status:202,headers:{'Cache-Control':'no-store'}});}catch(error){return apiFailure(error);}finally{await new Promise(resolve=>setTimeout(resolve,Math.max(0,300+randomInt(50)-(Date.now()-start))));}}
