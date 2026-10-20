import { useEffect } from "react";
import { useRouter } from "expo-router";
import { SignIn } from "@/components/SignIn";
import { useAuth } from "@/context/auth";

export default function SignInRoute() {
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => { if (user) router.replace("/(tabs)"); }, [user, router]);
  return <SignIn />;
}
