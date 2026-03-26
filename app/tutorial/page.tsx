"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Tutorial() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard?tour=1");
  }, [router]);
  return null;
}
