"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirect /user/[id] to /?profile=id so profile is shown in the main feed layout.
 */
export default function UserProfileRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      router.replace(`/?profile=${encodeURIComponent(id)}`);
    } else {
      router.replace("/");
    }
  }, [id, router]);

  return null;
}
