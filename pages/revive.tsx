import Header from "@/components/Header";
import { NextPage } from "next";
import Head from "next/head";
import { signIn, useSession } from "next-auth/react";
import useSWR from "swr";
import { useState } from "react";
import { Uploader } from "uploader";
import { UploadDropzone } from "react-uploader";
import Toggle from "@/components/Toggle";
import { CompareSlider } from "@/components/CompareSlider";
import { Rings } from "react-loader-spinner";
import Image from "next/image";
import downloadImage from "@/utils/downloadImage";
import appendNewToName from "@/utils/appendNewToName";
import Footer from "@/components/Footer";
import LoadingDots from "@/components/LoadingDots";

const uploader = Uploader({
  apiKey: !!process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    ? process.env.NEXT_PUBLIC_UPLOAD_API_KEY
    : "free",
});

const Home: NextPage = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [revivedImage, setRevivedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [sideBySide, setSideBySide] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [revivedLoaded, setRevivedLoaded] = useState<boolean>(false);

  const { data: session, status } = useSession();
  const fetcher = async (url: string) => {
    const res = await fetch(url);
    return res.json();
  };
  const { data, mutate } = useSWR("/api/remaining", fetcher);

  const options = {
    maxFileCount: 1,
    mimeTypes: ["image/jpeg", "image/png", "image/jpg"],
    editor: { images: { crop: false } },
    styles: { colors: { primary: "#000" } },
    onValidate: async (file: File): Promise<undefined | string> => {
      if (data.remainingGenerations === 0) {
        return "No more generations left for the day.";
      }
      return undefined;
    },
  };

  async function generateImage(fileUrl: string) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(true);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageUrl: fileUrl }),
    });

    let newImage = await res.json();
    if (res.status !== 200) {
      setError(newImage);
    } else {
      mutate();
      setRevivedImage(newImage);
    }
    setLoading(false);
  }

  const UploadDropZone = () => (
    <UploadDropzone
      uploader={uploader}
      options={options}
      onUpdate={(file) => {
        if (file.length !== 0) {
          setImageName(file[0].originalFile.originalFileName);
          setOriginalImage(file[0].fileUrl.replace("raw", "thumbnail"));
          generateImage(file[0].fileUrl.replace("raw", "thumbnail"));
        }
      }}
      width="670px"
      height="250px"
    />
  );
  return (
    <div className="flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>Revive Images</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header photo={session?.user?.image || undefined} />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-4 sm:mb-0 mb-8">
        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-normal text-slate-900 sm:text-6xl mb-5">
          Revive any face image
        </h1>
        {status === "authenticated" && data && (
          <p className="text-slate-500">
            You have{" "}
            <span className="font-semibold">
              {data.remainingGenerations} generations
            </span>{" "}
            left today. Your generation
            {Number(data.remainingGenerations) > 1 ? "s" : ""} will renew in{" "}
            <span className="font-semibold">
              {data.hours} hours and {data.minutes} minutes
            </span>
          </p>
        )}
        <div className="flex justify-between items-center w-full flex-col mt-4">
          <Toggle
            className={`${revivedLoaded ? "visible mb-6" : "invisible"}`}
            setSideBySide={(newVal) => setSideBySide(newVal)}
            sideBySide={sideBySide}
          ></Toggle>
          {revivedLoaded && sideBySide && (
            <CompareSlider original={originalImage!} revived={revivedImage!} />
          )}
          {status === "loading" ? (
            <div className="max-w-[670px] h-[250px] flex justify-center items-center">
              <Rings
                height="100"
                width="100"
                color="black"
                radius="6"
                wrapperStyle={{}}
                wrapperClass=""
                visible={true}
                ariaLabel="rings-loading"
              />
            </div>
          ) : status === "authenticated" && !originalImage ? (
            <UploadDropZone />
          ) : (
            !originalImage && (
              <div className="h-[250px] flex flex-col items-center space-y-6 max-w-[670px] -mt-8">
                <div className="max-w-xl text-gray-600">
                  Sign in below with Google to create a free account and revive
                  your images today. You will be able to revive 5 images per day
                  for free.
                </div>
                <button
                  onClick={() => signIn("google")}
                  className="bg-gray-200 text-black font-semibold py-3 px-6 rounded-xl flex items-center space-x-2"
                >
                  <Image
                    src="/google.png"
                    width={20}
                    height={20}
                    alt="google's logo"
                  />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )
          )}
          {originalImage && !revivedImage && (
            <Image
              alt="original image"
              src={originalImage}
              className="rounded-2xl"
              width={475}
              height={475}
            />
          )}
          {revivedImage && originalImage && !sideBySide && (
            <div className="flex sm:space-x-4 sm:flex-row flex-col">
              <div>
                <h2 className="mb-1 font-medium text-lg">Original Image</h2>
                <Image
                  alt="Original Image"
                  src={originalImage}
                  className="rounded-2xl relative"
                  width={475}
                  height={475}
                />
              </div>
              <div className="sm:mt-0 mt-8">
                <h2 className="mb-1 font-medium text-lg">Revived Image</h2>
                <a href={revivedImage} target="_blank" rel="noreferrer">
                  <Image
                    alt="revived image"
                    src={revivedImage}
                    className="rounded-2xl relative sm:mt-0 mt-2 cursor-zoom-in"
                    width={475}
                    height={475}
                    onLoadingComplete={() => setRevivedLoaded(true)}
                  />
                </a>
              </div>
            </div>
          )}
          {loading && (
            <button
              disabled
              className="bg-black rounded-full text-white font-medium px-4 pt-2 pb-3 mt-8 hover:bg-black/80 w-40"
            >
              <span className="pt-4">
                <LoadingDots color="white" style="large" />
              </span>
            </button>
          )}
          {error && (
            <div
              className="bg-red-100 border border-red-400 text-read-700 px-4 py-3 rounded-xl mt-8 max-w-[575px]"
              role="alert"
            >
              <div className="bg-red-500 text-white font-bold rounded-t px-4 py-2">
                Please try again in 24 hours
              </div>
              <div className="border  border-t-0 border-red-400 rounded-b bg-red-100 px-4 py-3 text-red-700">
                {error}
              </div>
            </div>
          )}
          <div className="flex space-x-2 justify-center">
            {originalImage && !loading && (
              <button
                onClick={() => {
                  setOriginalImage(null);
                  setRevivedImage(null);
                  setRevivedLoaded(false);
                  setError(null);
                }}
                className="bg-black rounded-full text-white font-medium px-4 py-2 mt-8 hover:bg-black/80 transition"
              >
                Upload New Image
              </button>
            )}
            {revivedLoaded && (
              <button
                onClick={() => {
                  downloadImage(revivedImage!, appendNewToName(imageName!));
                }}
                className="bg-white rounded-full text-black border font-medium px-4 py-2 mt-8 hover:bg-gray-100 transition"
              >
                Download Revived Image
              </button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
