import {createHash} from 'node:crypto';
import {Prisma} from '@prisma/client';
import {z} from 'zod';
import {prisma} from './prisma';
import {HttpError} from './http-body';
import {restaurantAvailable} from './operations';
import {safeImageUrl} from './image-policy';
import {publishedReview} from './reviews';
const id=z.string().regex(/^[A-Za-z0-9_-]{1,100}$/);
const input=z.object({limit:z.coerce.number().int().min(1).max(48).default(24),q:z.string().trim().max(100).default(''),category:z.string().trim().max(60).default(''),restaurantId:id.optional(),cursor:z.string().max(1000).optional(),ids:z.string().max(5100).optional()}).strict();
const cursorSchema=z.object({after:id,ceiling:id,at:z.string().datetime(),filter:z.string().length(64)}).strict();
export function catalogParameters(request?:Request,scope="public"){
 const params=new URL(request?.url??'http://localhost/api/catalog').searchParams;
 if([...params.keys()].some(k=>params.getAll(k).length!==1))throw new HttpError(400,'Repeated catalog parameter');
 const result=input.safeParse(Object.fromEntries(params));if(!result.success)throw new HttpError(400,'Check catalog filters and page size');const p=result.data;
 const ids=p.ids===undefined?undefined:p.ids.split(',');
 if(ids&&(!ids.length||ids.length>48||ids.some(v=>!id.safeParse(v).success)||new Set(ids).size!==ids.length||p.cursor||p.q||p.category))throw new HttpError(400,'Use at most 48 unique basket item IDs without other filters');
 const filter=createHash('sha256').update(JSON.stringify([scope,p.q.toLowerCase(),p.category,p.restaurantId??'',p.limit])).digest('hex');let cursor:z.infer<typeof cursorSchema>|undefined;
 if(p.cursor){try{cursor=cursorSchema.parse(JSON.parse(Buffer.from(p.cursor,'base64url').toString()));}catch{throw new HttpError(400,'Invalid catalog cursor');}if(cursor.filter!==filter||cursor.after>cursor.ceiling||Date.parse(cursor.at)>Date.now()+5000)throw new HttpError(400,'Cursor does not match this catalog');}
 return {...p,ids,filter,decoded:cursor};
}
export async function catalogPage(request?:Request,tenantId?:string){
 const p=catalogParameters(request,tenantId??"public");if(tenantId&&p.restaurantId&&p.restaurantId!==tenantId)throw new HttpError(403,'Restaurant access denied');const now=new Date();const conditions:Prisma.ProductWhereInput[]=[{archivedAt:null}];
 if(tenantId||p.restaurantId)conditions.push({restaurantId:tenantId??p.restaurantId});
 if(!tenantId)conditions.push({available:true,OR:[{categoryId:null},{menuCategory:{archivedAt:null}}],restaurant:{isOpen:true,lifecycle:'ACTIVE',owner:{active:true},OR:[{closedUntil:null},{closedUntil:{lte:now}}]}});
 if(p.q){const literal=[...p.q].map(c=>['\\','%','_'].includes(c)?'\\'+c:c).join('');conditions.push({OR:[{name:{contains:literal,mode:'insensitive'}},{description:{contains:literal,mode:'insensitive'}}]});}if(p.category)conditions.push({category:p.category});if(p.ids)conditions.push({id:{in:p.ids}});
 const base:Prisma.ProductWhereInput={AND:conditions};
 // Keyset uses the existing primary key and restaurantId/available index. No OFFSET or whole-catalog read.
 const ceiling=p.decoded?.ceiling??(await prisma.product.findFirst({where:base,orderBy:{id:'desc'},select:{id:true}}))?.id;
 // Product timestamps come from PostgreSQL. Using the application clock here can
 // omit newly committed items when the DB clock/ millisecond rounding is ahead.
 if(!ceiling)return {products:[],nextCursor:null,categories:[],limit:p.limit};
 const at=p.decoded?.at??(await prisma.$queryRaw<{at:Date}[]>`SELECT clock_timestamp()::timestamp(3) AS at`)[0].at.toISOString();
 const rows=await prisma.product.findMany({where:{AND:[base,{id:{lte:ceiling,...(p.decoded?{gt:p.decoded.after}:{})},createdAt:{lte:new Date(at)}}]},take:p.ids?48:p.limit+1,orderBy:{id:'asc'},include:{options:{where:{archivedAt:null},orderBy:{id:'asc'},take:50},restaurant:{select:{id:true,name:true,city:true,isOpen:true,lifecycle:true,weeklyHours:true,closedUntil:true,owner:{select:{active:true}}}}}});
 const page=p.ids?rows:rows.slice(0,p.limit),visible=tenantId?page:page.filter(v=>restaurantAvailable(v.restaurant,now)),restaurantIds=[...new Set(visible.map(v=>v.restaurantId))],productIds=visible.map(v=>v.id);
 const ratings=tenantId||!visible.length?[]:await prisma.purchaseReview.groupBy({by:['restaurantId','productId'],where:{AND:[publishedReview,{OR:[{restaurantId:{in:restaurantIds},productId:null},{productId:{in:productIds}}]}]},_avg:{rating:true},_count:{rating:true}});
 const categories=[...new Set(visible.map(v=>v.category))];
 return {products:visible.map(v=>({...v,imageUrl:safeImageUrl(v.imageUrl),restaurant:{id:v.restaurant.id,name:v.restaurant.name,city:v.restaurant.city},restaurantRating:ratings.filter(r=>r.restaurantId===v.restaurantId&&r.productId===null).map(r=>({average:r._avg.rating,count:r._count.rating}))[0]??null,itemRating:ratings.filter(r=>r.productId===v.id).map(r=>({average:r._avg.rating,count:r._count.rating}))[0]??null})),nextCursor:!p.ids&&rows.length>p.limit?Buffer.from(JSON.stringify({after:page.at(-1)!.id,ceiling,at,filter:p.filter})).toString('base64url'):null,categories,limit:p.ids?48:p.limit};
}
