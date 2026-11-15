import { NextResponse } from "next/server";
import { forwardPublicPost } from "@/lib/api/server";
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(v:unknown,max=200)=>String(v??"").trim().slice(0,max);
export async function POST(req:Request){
 let body:Record<string,unknown>;try{body=await req.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const lead={name:clean(body.name,120),email:clean(body.email).toLowerCase(),company:clean(body.company),source:clean(body.source,60)||"website"};
 if(!EMAIL.test(lead.email))return NextResponse.json({error:"Please enter a valid email address."},{status:422});
 return forwardPublicPost("/leads/",lead);
}
