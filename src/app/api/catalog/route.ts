import {NextResponse} from 'next/server';
import {catalogPage} from '@/lib/catalog';
import {apiFailure} from '@/lib/api-failure';
export async function GET(request:Request){try{return NextResponse.json(await catalogPage(request),{headers:{'Cache-Control':'no-store'}});}catch(error){return apiFailure(error);}}
