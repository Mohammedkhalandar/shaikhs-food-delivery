import {z} from 'zod';import {Prisma} from '@prisma/client';import {HttpError} from './http-body';import {safeImageUrl} from './image-policy';
export const priceSchema=z.union([z.string().regex(/^\d{1,6}(\.\d{1,2})?$/),z.number().finite().nonnegative().max(100000).refine(v=>new Prisma.Decimal(v).decimalPlaces()<=2)]).transform(v=>new Prisma.Decimal(v)).refine(v=>v.lte(100000));
export const optionSchema=z.object({id:z.string().optional(),name:z.string().trim().min(1).max(80),kind:z.enum(['VARIANT','ADDON']),price:priceSchema,available:z.boolean()}).strict().refine(o=>o.kind==='ADDON'||o.price.greaterThan(0));
export const productSchema=z.object({name:z.string().trim().min(2).max(120),category:z.string().trim().min(2).max(60).optional(),categoryId:z.string().min(1).optional(),description:z.string().max(1000).optional(),price:priceSchema.refine(v=>v.greaterThan(0)),imageUrl:z.string().max(2048).nullable().optional().refine(v=>!v||safeImageUrl(v)!==null),available:z.boolean().optional(),options:z.array(optionSchema).max(30).optional(),version:z.number().int().nonnegative().optional()}).strict();
export function configuredPrice(product:{name:string;price:Prisma.Decimal;options?:{id:string;name:string;kind:string;price:Prisma.Decimal;available:boolean;archivedAt:Date|null}[]},selection:{variantId?:string;addonIds?:string[]}){
 const options=(product.options??[]).filter(o=>!o.archivedAt&&o.available);const variants=(product.options??[]).filter(o=>!o.archivedAt&&o.kind==='VARIANT');
 const variant=selection.variantId?options.find(o=>o.id===selection.variantId&&o.kind==='VARIANT'):undefined;
 if(selection.variantId&&!variant||variants.length&&!variant)throw new HttpError(409,'Choose an available variant');
 const addons=(selection.addonIds??[]).map(id=>{const o=options.find(o=>o.id===id&&o.kind==='ADDON');if(!o)throw new HttpError(409,'An add-on is unavailable');return o;});
 const selected=[...(variant?[variant]:[]),...addons];const price=addons.reduce((sum,o)=>sum.plus(o.price),variant?.price??product.price);
 return {price,nameSnapshot:product.name+(selected.length?' ('+selected.map(o=>o.name).join(', ')+')':''),optionsSnapshot:selected.map(o=>({id:o.id,name:o.name,kind:o.kind,price:o.price.toFixed(2)}))};
}
