import {Prisma} from '@prisma/client';import {productSchema} from './menu';import {HttpError} from './http-body';import {safeImageUrl} from './image-policy';
export async function saveMenuProduct(tx:Prisma.TransactionClient,restaurantId:string,input:unknown,id?:string){
 const p=(id?productSchema.partial():productSchema).safeParse(input);if(!p.success)throw new HttpError(400,'Invalid item details, price or options');const b=p.data;
 const old=id?await tx.product.findFirst({where:{id,restaurantId,archivedAt:null}}):null;if(id&&!old)throw new HttpError(404,'Menu item not found');
 let categoryId=b.categoryId??old?.categoryId;let category=b.category??old?.category;
 if(b.categoryId){const c=await tx.menuCategory.findFirst({where:{id:b.categoryId,restaurantId,archivedAt:null}});if(!c)throw new HttpError(400,'Choose this restaurant\'s active category');category=c.name;categoryId=c.id;}
 else if(b.category||(!categoryId&&category)){const name=b.category??category!;const c=await tx.menuCategory.upsert({where:{restaurantId_name:{restaurantId,name}},create:{restaurantId,name},update:{}});if(c.archivedAt)throw new HttpError(409,'Category is archived; create a new category');categoryId=c.id;category=c.name;}
 if(!category||!categoryId)throw new HttpError(400,'Choose a category');
 if(b.imageUrl?.startsWith('/api/menu-images/')){const image=await tx.menuImage.findFirst({where:{id:b.imageUrl.split('/').pop(),restaurantId},select:{id:true}});if(!image)throw new HttpError(400,'Upload an image for this restaurant');}
 if(b.imageUrl&&!safeImageUrl(b.imageUrl))throw new HttpError(400,'Invalid image URL');
 const data={name:b.name,price:b.price,description:b.description,imageUrl:b.imageUrl,available:b.available,category,categoryId};
 let product;
 if(old){const changed=await tx.product.updateMany({where:{id:old.id,version:b.version??old.version,archivedAt:null},data:{...data,version:{increment:1}}});if(changed.count!==1)throw new HttpError(409,'Menu item changed. Reload before saving');product=await tx.product.findUniqueOrThrow({where:{id:old.id}});}
 else product=await tx.product.create({data:{...data,name:b.name!,price:b.price!,restaurantId}});
 if(b.options){const ids=b.options.flatMap(o=>o.id?[o.id]:[]);if(new Set(ids).size!==ids.length)throw new HttpError(400,'Duplicate option IDs');const existing=await tx.productOption.findMany({where:{productId:product.id}});if(ids.some(optionId=>!existing.some(o=>o.id===optionId&&!o.archivedAt)))throw new HttpError(400,'An option does not belong to this item');await tx.productOption.updateMany({where:{productId:product.id,id:{notIn:ids},archivedAt:null},data:{archivedAt:new Date(),available:false}});for(const o of b.options){const {id:optionId,...details}=o;if(optionId)await tx.productOption.update({where:{id:optionId},data:details});else await tx.productOption.create({data:{...details,productId:product.id}});}}
 return tx.product.findUniqueOrThrow({where:{id:product.id},include:{options:{where:{archivedAt:null}}}});
}
