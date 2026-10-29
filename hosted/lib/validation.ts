import {z} from 'zod';
export const runInput=z.object({agentId:z.uuid(),input:z.string().trim().min(1).max(20000),requestId:z.uuid()});
export const agentInput=z.object({name:z.string().trim().min(1).max(100),instructions:z.string().trim().min(10).max(12000),knowledge:z.string().max(30000),template:z.string().max(80),apps:z.array(z.enum(['github','files','github_private','slack','airtable'])).max(5)});
