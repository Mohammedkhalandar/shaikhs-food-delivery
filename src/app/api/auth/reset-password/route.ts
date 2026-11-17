import { NextResponse } from 'next/server';
import { z } from 'zod';
import { jsonBody,HttpError } from '@/lib/http-body';
import { rateLimit } from '@/lib/rate-limit';
import { resetPassword } from '@/lib/recovery';
import { tokenHash } from '@/lib/local-mail';
import { destroySession } from '@/lib/auth';
import { apiFailure } from '@/lib/api-failure';
const schema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(10).max(72).refine(v=>Buffer.byteLength(v,'utf8')<=72)}).strict();
export async function POST(req:Request){try{const p=schema.safeParse(await jsonBody(req));if(!p.success)throw new HttpError(400,'Use a valid reset link and a password of 10–72 bytes.');if(!await rateLimit('reset-global','all',60,60)||!await rateLimit('reset-token',tokenHash(p.data.token),5))throw new HttpError(429,'Too many attempts. Try again later.');await resetPassword(p.data.token,p.data.password);await destroySession();return NextResponse.json({message:'Password updated. Sign in with your new password.'},{headers:{'Cache-Control':'no-store'}});}catch(error){return apiFailure(error);}}
