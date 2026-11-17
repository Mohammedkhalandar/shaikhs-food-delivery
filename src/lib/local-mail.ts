import { createHash,randomBytes,createCipheriv,createDecipheriv } from 'node:crypto';
import { prisma } from './prisma';
import { localDevelopment } from './restaurant-access';
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export function localMailEnabled(){try{return process.env.MAIL_DELIVERY_MODE==='local'&&localDevelopment()&&['localhost','127.0.0.1'].includes(new URL(process.env.APP_URL??'').hostname)&&/^[a-f0-9]{64}$/i.test(process.env.DEV_MAIL_KEY??'');}catch{return false;}}
function key(){if(!localMailEnabled())throw Error('LOCAL_MAIL_DISABLED');return Buffer.from(process.env.DEV_MAIL_KEY!,'hex');}
export function encryptMail(body:string,id:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from(id));const encrypted=Buffer.concat([cipher.update(body,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),encrypted].map(b=>b.toString('base64')).join('.');}
export function decryptMail(body:string,id:string){const [iv,tag,data]=body.split('.').map(s=>Buffer.from(s,'base64'));const cipher=createDecipheriv('aes-256-gcm',key(),iv);cipher.setAAD(Buffer.from(id));cipher.setAuthTag(tag);return Buffer.concat([cipher.update(data),cipher.final()]).toString('utf8');}
/** Durable local adapter. LOCAL_READY means previewable locally, never externally sent. */
export async function deliverLocalMail(messageId?:string){
 if(!localMailEnabled())return;
 const now=new Date();
 await prisma.emailOutbox.updateMany({where:{state:'PROCESSING',leaseUntil:{lt:now},attempts:{gte:5}},data:{state:'FAILED',lastErrorCode:'LEASE_EXHAUSTED',leaseToken:null,leaseUntil:null}});
 const rows=await prisma.emailOutbox.findMany({where:{...(messageId?{id:messageId}:{}),attempts:{lt:5},OR:[{state:'PENDING',nextAttemptAt:{lte:now}},{state:'PROCESSING',leaseUntil:{lt:now}}]},take:20,orderBy:{createdAt:'asc'}});
 for(const row of rows){const leaseToken=randomBytes(16).toString('hex');const claimed=await prisma.emailOutbox.updateMany({where:{id:row.id,state:row.state,attempts:row.attempts,leaseToken:row.leaseToken},data:{state:'PROCESSING',attempts:{increment:1},leaseToken,leaseUntil:new Date(Date.now()+30000)}});if(!claimed.count)continue;
  try{await validateLocalMessage(row);decryptMail(row.encryptedBody,row.id);await prisma.emailOutbox.updateMany({where:{id:row.id,leaseToken},data:{state:'LOCAL_READY',deliveredAt:new Date(),leaseToken:null,leaseUntil:null,lastErrorCode:null}});
  }catch(error){const expired=error instanceof Error&&error.message==='EXPIRED';await prisma.emailOutbox.updateMany({where:{id:row.id,leaseToken},data:{state:expired||row.attempts+1>=5?'FAILED':'PENDING',lastErrorCode:expired?'LINK_EXPIRED':'LOCAL_DELIVERY_UNAVAILABLE',nextAttemptAt:new Date(Date.now()+Math.min(300000,1000*2**(row.attempts+1))),leaseToken:null,leaseUntil:null}});}
 }
}

export async function validateLocalMessage(row:{resetTokenId:string|null;verificationTokenId:string|null}){if(row.resetTokenId){const token=await prisma.passwordResetToken.findUniqueOrThrow({where:{id:row.resetTokenId},include:{user:true}});if(token.usedAt||token.expiresAt<=new Date()||!token.user.active||token.authVersion!==token.user.authVersion)throw Error('EXPIRED');}else if(row.verificationTokenId){const token=await prisma.emailVerificationToken.findUniqueOrThrow({where:{id:row.verificationTokenId},include:{user:true}});if(token.usedAt||token.expiresAt<=new Date()||!token.user.active||token.authVersion!==token.user.authVersion||token.originalEmail!==token.user.email||token.user.role!=='CUSTOMER'||token.purpose==='VERIFY'&&!!token.user.emailVerifiedAt)throw Error('EXPIRED');}else throw Error('EXPIRED');}
