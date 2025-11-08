import Image from "next/image";
import ChatBot from "./ChatBot";
import GoogleMaps from "./GoogleMaps";

export default function Home() {
  return (
    <div className="flex flex-row items-center justify-center h-screen w-screen">
      <div className="border-r-2 h-full border-red-500 ">
        <ChatBot />
      </div>

      <div>
        <GoogleMaps />
      </div>
    </div>
  );
}
