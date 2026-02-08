"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Safety net: if middleware ghost route rewrite didn't catch this,
    // redirect to home immediately without any side effects.
    router.replace("/");
  }, [router]);

  return null;
}
