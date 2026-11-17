import { randomBytes,randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { HttpError } from './http-body';
import { localMailEnabled,tokenHash,encryptMail,deliverLocalMail } from './local-mail';
export async function requestRecovery(email:string){
 const token=randomBytes(32).toString('hex');
 if(!localMailEnabled())return;
 const messageId=await prisma.$transaction(async tx=>{
  const user=await tx.user.findUnique({where:{email}});if(!user?.active)return;
  await tx.$queryRaw`SELECT id FROM "User" WHERE id=${user.id} FOR UPDATE`;
  const fresh=await tx.user.findUniqueOrThrow({where:{id:user.id}});if(!fresh.active)return;
  await tx.passwordResetToken.updateMany({where:{userId:user.id,usedAt:null},data:{usedAt:new Date()}});
  const expiresAt=new Date(Date.now()+30*60000),id=randomUUID();
  const reset=await tx.passwordResetToken.create({data:{userId:user.id,tokenHash:tokenHash(token),authVersion:fresh.authVersion,expiresAt}});
  const url=new URL('/recover',process.env.APP_URL!);url.hash=token;
  // First delivery is immediately due even when PostgreSQL and Node clocks differ slightly.
  await tx.emailOutbox.create({data:{id,userId:user.id,resetTokenId:reset.id,nextAttemptAt:new Date(0),recipient:email,subject:'Reset your Shaikh’s password (local development)',encryptedBody:encryptMail(JSON.stringify({url:url.toString(),expiresAt:expiresAt.toISOString(),localOnly:true}),id)}});
  return id;
 });
 if(messageId)await deliverLocalMail(messageId).catch(()=>{}); // Failed adapter work remains durable and retryable.
}
export async function resetPassword(token:string,password:string){
 const hash=tokenHash(token);const candidate=await prisma.passwordResetToken.findUnique({where:{tokenHash:hash}});
 if(!candidate||candidate.usedAt||candidate.expiresAt<=new Date())throw new HttpError(400,'Reset link is invalid or expired. Request a new one.');
 const passwordHash=await bcrypt.hash(password,12);
 await prisma.$transaction(async tx=>{
  await tx.$queryRaw`SELECT id FROM "User" WHERE id=${candidate.userId} FOR UPDATE`;
  const fresh=await tx.passwordResetToken.findUniqueOrThrow({where:{id:candidate.id},include:{user:true}});
  if(fresh.usedAt||fresh.expiresAt<=new Date()||!fresh.user.active||fresh.authVersion!==fresh.user.authVersion)throw new HttpError(400,'Reset link is invalid or expired. Request a new one.');
  await tx.user.update({where:{id:fresh.userId},data:{passwordHash,authVersion:{increment:1}}});
  await tx.passwordResetToken.updateMany({where:{userId:fresh.userId,usedAt:null},data:{usedAt:new Date()}});
  await tx.notification.create({data:{userId:fresh.userId,eventKey:`password-reset:${fresh.id}`,kind:'SECURITY',title:'Password updated',body:'Your password was changed and existing sessions were signed out.'}});
 });
}
