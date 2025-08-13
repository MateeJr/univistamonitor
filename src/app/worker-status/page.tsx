import WorkerStatusPage from "@/components/pages/WorkerStatusPage";

export default function Page() {
  return (
    <main className="px-6 pt-2 md:pt-4 pb-6 flex flex-col h-[calc(100dvh-80px)] md:h-[100dvh] overflow-hidden box-border">
      <WorkerStatusPage />
    </main>
  );
}
