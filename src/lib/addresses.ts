import {z} from 'zod';
export const postalCodeSchema=z.string().trim().regex(/^[1-9]\d{5}$/,'Enter a six-digit Indian postal code');
const text=(min:number,max:number)=>z.string().transform(v=>v.normalize('NFKC').trim().replace(/\s+/g,' ')).pipe(z.string().min(min).max(max));
export const addressSchema=z.object({label:z.enum(['HOME','WORK','OTHER']),addressLine:text(5,200),landmark:text(0,120).default(''),city:text(2,80),state:text(2,80),postalCode:postalCodeSchema,instructions:text(0,300).default(''),isDefault:z.boolean().optional()}).strict();
export type AddressDetails={label:string;addressLine:string;landmark:string;city:string;state:string;postalCode:string;instructions:string};
export function formatAddress(a:AddressDetails){return [a.addressLine,a.landmark,a.city,`${a.state} ${a.postalCode}`].filter(Boolean).join(', ');}
