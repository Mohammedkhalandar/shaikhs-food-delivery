import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { HttpError } from './http-body';
export function apiFailure(error:unknown){const conflict=error instanceof Prisma.PrismaClientKnownRequestError&&['P2002','P2034'].includes(error.code);return NextResponse.json({error:error instanceof HttpError?error.message:conflict?'Record changed or already exists. Refresh and retry.':'Request unavailable. Please retry.'},{status:error instanceof HttpError?error.code:conflict?409:503});}
