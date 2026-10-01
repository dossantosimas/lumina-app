// Isolated CLI schema configuration; equivalent auth fields to the web instance.
import {betterAuth} from 'better-auth';
import {prismaAdapter} from 'better-auth/adapters/prisma';
export const auth=betterAuth({database:prismaAdapter({}, {provider:'postgresql'}),emailAndPassword:{enabled:true,disableSignUp:true},user:{additionalFields:{activeAccess:{type:'boolean',defaultValue:false,input:false}}},rateLimit:{enabled:true,storage:'database'}});
