import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: NextRequest){
  try{
    const body = await req.json();

    // we can validate the input using Zod here
    const {fileName, contentType} = body;

    const key = `uploads/${fileName}`;       
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    return NextResponse.json({ success: true, presignedUrl, key }, {status: 200});
  }  
  catch(err){
    console.log("Error while generating presignedURL: ", err);
    return NextResponse.json({success: false}, {status: 500});
  }
}




// setup AWS S3 flow


// then check if Gemini can directly access the video from S3 using presigned URL

//if no: allow the GCS flow 