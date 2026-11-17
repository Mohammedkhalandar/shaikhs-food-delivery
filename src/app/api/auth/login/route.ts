import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { HttpError, jsonBody } from "@/lib/http-body";
const schema=z.object({email:z.email().max(254),password:z.string().min(8).max(1024)});
// Match bcrypt work for missing accounts; this hash is a public dummy, not a credential.
const dummyHash=bcrypt.hashSync("shaikhs-invalid-account-placeholder",12);
export async function POST(req:Request){
 let body:unknown;try{body=await jsonBody(req)}catch(error){return NextResponse.json({error:"Invalid sign-in request"},{status:error instanceof HttpError?error.code:400})}
 const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Enter a valid email and password."},{status:400});
 try {
 if(!await rateLimit("login-global","all",120,60)||!await rateLimit("login-account",parsed.data.email.toLowerCase(),10))return NextResponse.json({error:"Too many sign-in attempts. Try again later."},{status:429,headers:{"Retry-After":"900"}});
 const user=await prisma.user.findUnique({where:{email:parsed.data.email.toLowerCase()}});
 const matches=await bcrypt.compare(parsed.data.password,user?.passwordHash??dummyHash);
 if(!user||!user.active||!matches)return NextResponse.json({error:"Invalid email or password."},{status:401});
 await createSession(user);return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role,emailVerificationRequired:user.emailVerificationRequired,emailVerifiedAt:user.emailVerifiedAt}});
 }catch{console.error("auth.login.unavailable");return NextResponse.json({error:"Sign-in temporarily unavailable"},{status:503})}
}
