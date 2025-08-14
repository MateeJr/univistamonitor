
import HomePage from "@/components/pages/HomePage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const token = (await cookies()).get("uv_token")?.value;
  if (!token) {
    redirect("/akun");
  }
  return (
    <main className="p-6">
      <HomePage />
    </main>
  );
}
