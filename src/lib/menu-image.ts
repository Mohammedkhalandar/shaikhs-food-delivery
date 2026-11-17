import sharp from 'sharp';import {HttpError} from './http-body';
export async function validatedMenuImage(bytes:Buffer,contentType:string){
 if(!['image/jpeg','image/png','image/webp'].includes(contentType))throw new HttpError(415,'Upload JPEG, PNG or WebP only');
 if(!bytes.length||bytes.length>2097152)throw new HttpError(413,'Image must be at most 2 MB');
 try{const image=sharp(bytes,{limitInputPixels:16000000,animated:false,failOn:'warning'});const info=await image.metadata();const expected=contentType==='image/jpeg'?'jpeg':contentType.slice(6);if(info.format!==expected||!info.width||!info.height||(info.pages??1)>1||info.width*info.height>16000000)throw Error();const normalized=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:82}).toBuffer();if(normalized.length>2097152)throw new HttpError(413,'Decoded image is too large');return normalized;}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'Image content is invalid, animated or too large');}
}
