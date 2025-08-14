import MesinPage from "@/components/pages/MesinPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const token = (await cookies()).get("uv_token")?.value;
  if (!token) {
    redirect("/akun");
  }
  return (
    <main className="px-6 pt-2 md:pt-4 pb-4 flex flex-col h-[calc(100dvh-80px)] md:h-[100dvh] overflow-hidden box-border">
      <MesinPage />
    </main>
  );
}
