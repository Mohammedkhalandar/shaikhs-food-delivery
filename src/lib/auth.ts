import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";
const cookieName="shaikhs_session";
function secret(){const s=process.env.JWT_SECRET;if(!s||s.length<32)throw new Error("JWT_SECRET must contain at least 32 characters");return new TextEncoder().encode(s);}
export async function createSession(user:{id:string;email:string;name:string;role:Role;authVersion?:number}){
 const token=await new SignJWT({email:user.email,name:user.name,role:user.role,ver:user.authVersion??0}).setProtectedHeader({alg:"HS256"}).setSubject(user.id).setIssuedAt().setExpirationTime("7d").sign(secret());
 const jar=await cookies();jar.set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:60*60*24*7});
}
export async function destroySession(){const jar=await cookies();jar.delete(cookieName);}
export async function currentUser(){
 const token=(await cookies()).get(cookieName)?.value;if(!token)return null;
 try{const {payload}=await jwtVerify(token,secret(),{algorithms:["HS256"]});if(!payload.sub)return null;
  const user=await prisma.user.findUnique({where:{id:payload.sub},select:{id:true,name:true,email:true,role:true,active:true,authVersion:true,emailVerificationRequired:true,emailVerifiedAt:true}});
  return user?.active && (payload.ver??0)===user.authVersion ? user : null;
 }catch{return null;}
}
export async function requireRole(...roles:Role[]){
 const user=await currentUser();if(!user||!user.active)throw new Error("UNAUTHENTICATED");
 if(!roles.includes(user.role))throw new Error("FORBIDDEN");return user;
}
