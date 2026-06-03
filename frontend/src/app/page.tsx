"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mrv_token="))
      ?.split("=")[1];
      
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );
}