import StatusPage from "@/components/pages/StatusPage";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Page() {
  const token = cookies().get("uv_token")?.value;
  if (!token) {
    redirect("/akun");
  }
  return (
    <main className="p-6">
      <StatusPage />
    </main>
  );
}
