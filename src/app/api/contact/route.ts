import { NextResponse } from "next/server";
import { forwardPublicPost } from "@/lib/api/server";
const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean=(v:unknown,max=500)=>String(v??"").trim().slice(0,max);
export async function POST(req:Request){
 let body:Record<string,unknown>;try{body=await req.json();}catch{return NextResponse.json({error:"Invalid request."},{status:400});}
 const entry={first_name:clean(body.firstName,100),last_name:clean(body.lastName,100),email:clean(body.email,200).toLowerCase(),company:clean(body.company,200),role:clean(body.role,60),message:clean(body.message,4000)};
 if(!entry.first_name||!EMAIL.test(entry.email))return NextResponse.json({error:"Please add your name and a valid email."},{status:422});
 if(clean(body.website))return NextResponse.json({ok:true});
 return forwardPublicPost("/contact/",entry);
}
