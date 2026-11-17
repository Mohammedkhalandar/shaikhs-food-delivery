import {queueVerification} from '@/lib/email-verification';
import {deliverLocalMail} from '@/lib/local-mail';
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { rateLimit } from "@/lib/rate-limit";
import { HttpError, jsonBody } from "@/lib/http-body";
const schema=z.object({name:z.string().trim().min(2).max(80),email:z.email().max(254),password:z.string().min(10).max(72).refine(value=>Buffer.byteLength(value,"utf8")<=72)});
export async function POST(req:Request){
 let body:unknown;try{body=await jsonBody(req)}catch(error){return NextResponse.json({error:"Invalid registration request"},{status:error instanceof HttpError?error.code:400})}
 const parsed=schema.safeParse(body);
 if(!parsed.success)return NextResponse.json({error:"Enter a name, valid email and password (10+ characters)."}, {status:400});
 const {name,email,password}=parsed.data;
 try{
  if(!await rateLimit("register-global","all",30,60)||!await rateLimit("register-account",email.toLowerCase(),5))return NextResponse.json({error:"Too many registration attempts. Try again later."},{status:429,headers:{"Retry-After":"900"}});
  const passwordHash=await bcrypt.hash(password,12);
  const {user,message}=await prisma.$transaction(async tx=>{const user=await tx.user.create({data:{name,email:email.toLowerCase(),passwordHash,role:"CUSTOMER",emailVerificationRequired:true}});const message=await queueVerification(tx,user);return {user,message};});
  if(message)await deliverLocalMail(message).catch(()=>{});
  await createSession(user);
  return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role,emailVerificationRequired:user.emailVerificationRequired,emailVerifiedAt:user.emailVerifiedAt}},{status:201});
 }catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError&&error.code==="P2002")return NextResponse.json({error:"An account with this email may already exist."},{status:409});console.error("auth.register.unavailable");return NextResponse.json({error:"Registration temporarily unavailable"},{status:503})}
}
