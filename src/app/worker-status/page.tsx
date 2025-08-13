import WorkerStatusPage from "@/components/pages/WorkerStatusPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Page() {
  const token = cookies().get("uv_token")?.value;
  if (!token) {
    redirect("/akun");
  }
  return (
    <main className="px-6 pt-2 md:pt-4 pb-6 flex flex-col h-[calc(100dvh-80px)] md:h-[100dvh] overflow-hidden box-border">
      <WorkerStatusPage />
    </main>
  );
}
