import {NextRequest, NextResponse} from "next/server";
import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let ai: GoogleGenAI | null = null;
let s3: S3Client | null = null;
try{
  ai = new GoogleGenAI({});
  s3 = new S3Client({region: process.env.AWS_REGION});
}catch(e){
  console.log(e);
}

export async function POST(request: NextRequest){
  const body = await request.json();
  const {key, contentType} = body;
  if(ai && s3){
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key
    });
    const readURL = await getSignedUrl(s3, command, {expiresIn: 300});
    console.log("GEt presigned url: ", readURL);

    const response = await ai?.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createUserContent([
        createPartFromUri(readURL, contentType),
        "Describe the video in 5 sentences.",
      ]),
    });
    console.log("Response from gemini: ", response);
    console.log("asnwerrrrrr", response.text);
    return NextResponse.json({description: response.text}, {status: 200});
  }else{
    return NextResponse.json({success: false}, {status: 500})
  }

}


// get the key from FE -> generate presigned url to GET video -> google gemini request -> response to FE