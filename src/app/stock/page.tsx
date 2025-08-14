import StockPage from "@/components/pages/StockPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const token = (await cookies()).get("uv_token")?.value;
  if (!token) {
    redirect("/akun");
  }
  return (
    <main className="px-6 pt-2 md:pt-4 pb-6 flex flex-col min-h-[calc(100dvh-80px)] md:h-[100dvh] overflow-visible md:overflow-hidden box-border">
      <StockPage />
    </main>
  );
}
