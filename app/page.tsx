'use client'
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

export default function Home() {
  const [vid, setVid] = useState<File | null>(null);
  const [description, setDescription] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if(vid){
      setLoading(true);
      setDescription("");

      const url = URL.createObjectURL(vid);
      setPreviewUrl(url);

    (async()=>{
      console.log("Video: ", vid);
      console.log("Video info: ", vid.name);

      // get pre signed url   
      const presignedURLResponse = await fetch("/api/get-presigned-url", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          fileName: vid.name,
          contentType: vid.type //withput it it might work
        })
      })
      if(!presignedURLResponse.ok){
        console.log("Unable to store video to Storage.");
        setDescription("Error while generating the answer.")
        return;
      }
      const presignedURLToStoreVideo = await presignedURLResponse.json();
      console.log("Presigned URL: ", presignedURLToStoreVideo);

      
      //store the video in s3 
      const videoStoredResponse = await fetch(presignedURLToStoreVideo.presignedUrl, {
        body: vid,
        method: "PUT",
        headers: {
          "Content-Type": vid.type
        }
      })

      if(!videoStoredResponse.ok){
        console.log("Video not stored in S3 successfully.");
        setDescription("Error while generating the answer.")
        return;
      }
      
      console.log("Video stored successfully.",videoStoredResponse); 

      //send fetch request to generate answer 
      const generateAnswerResponse = await fetch("/api/generate-answer", {
        body: JSON.stringify({
          key: presignedURLToStoreVideo.key,
          contentType: vid.type
        }),
        method: "POST",
        headers: {
          'Content-Type': "application/json"
        }
      })
      if(!generateAnswerResponse.ok){
        console.log("Description not generated Successfully.");
        setDescription("Error while generating the answer.")
        setLoading(false);
        return;
      }
      const generatedAnswer = await generateAnswerResponse.json();

      // setDescription()
      if(generatedAnswer){
        setDescription(generatedAnswer.description);
      }
      setLoading(false);
    })();
  }
  }, [vid])



  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8 bg-[#0a0a0a]">
      <h1 className="font-semibold text-white/90 text-3xl">Video Analyzer</h1>

      <label className="group cursor-pointer flex flex-col items-center justify-center w-full max-w-xl h-40 rounded-2xl border-2 border-dashed border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all duration-300">
        <div className="flex flex-col items-center gap-3 text-white/40 group-hover:text-white/70 transition-all">
            <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
              <Plus size={22} />
            </div>
            <span className="text-sm font-medium">
              {vid ? vid.name : "Upload a video"}
            </span>
          </div>
        <input type="file" accept="video/mp4" onChange={e => setVid((e.target.files)? e.target.files[0] : null)} className="cursor-poitner hidden"></input>
      </label>

      {vid && <video src={previewUrl} autoPlay className="w-full max-w-2xl aspect-video object-contain rounded-md border-2" ></video>}
      {loading && <Loader2 className="animate-spin" />}
      <p className="text-white/70 text-lg max-w-5xl text-center">{description}</p>
    </div>
  );
}



// generate presigned url
// store to s3
// send file id to server
// send the id to it to Gogle gemini api -> ggenerate response -> frontend 