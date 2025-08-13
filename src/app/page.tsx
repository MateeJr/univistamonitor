import HomePage from "@/components/pages/HomePage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const token = cookies().get("uv_token")?.value;
  if (!token) {
    redirect("/akun");
  }
  return (
    <main className="p-6">
      <HomePage />
    </main>
  );
}
