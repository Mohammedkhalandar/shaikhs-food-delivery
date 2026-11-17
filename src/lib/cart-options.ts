export type CatalogOption={id:string;name:string;kind:'VARIANT'|'ADDON';price:string|number;available:boolean;stockTracked?:boolean;stockQuantity?:number};
export type CatalogProduct={id:string;name:string;price:string|number;options?:CatalogOption[]};
export type Choice={variantId?:string;addonIds:string[]};
export function cartKey(id:string,choice:Choice){return choice.variantId||choice.addonIds.length?[id,choice.variantId??'',...choice.addonIds.slice().sort()].join('|'):id;}
export function readCartKey(key:string){const [productId,variantId,...addonIds]=key.split('|');return {productId,variantId:variantId||undefined,addonIds};}
export function chosenPrice(product:CatalogProduct,choice:Choice){const options=product.options??[];const variant=choice.variantId?options.find(o=>o.id===choice.variantId&&o.kind==='VARIANT'):undefined;return (variant?Number(variant.price):Number(product.price))+choice.addonIds.reduce((sum,id)=>sum+Number(options.find(o=>o.id===id&&o.kind==='ADDON')?.price??0),0);}
export function defaultChoice(product:CatalogProduct):Choice{return {variantId:product.options?.find(o=>o.kind==='VARIANT'&&o.available&&(!o.stockTracked||(o.stockQuantity??0)>0))?.id??product.options?.find(o=>o.kind==='VARIANT')?.id,addonIds:[]};}
