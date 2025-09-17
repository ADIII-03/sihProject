"use client"; 
import { useParams } from "next/navigation";
import ViewProfilePage from "@/app/ViewProfilePage/page";

export default function FloatProfileWrapper() {
  const params = useParams();
  const floatId = params.floatId as string; // Type assertion

  return <ViewProfilePage floatId={floatId} />;
}
