import type {ErrorCode} from '@/lib/contracts';
export class DomainError extends Error {
  constructor(public readonly code:ErrorCode,message:string,public readonly fieldErrors?:Record<string,string[]>) {super(message);this.name='DomainError';}
}
