"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = Cookies.get("mrv_token");
    if (token) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-900">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg">Yükleniyor...</p>
      </div>
    </div>
  );
}