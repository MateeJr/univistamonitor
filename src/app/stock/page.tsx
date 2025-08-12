import StockPage from "@/components/pages/StockPage";

export default function Page() {
  return (
    <main className="px-6 pt-2 md:pt-4 pb-4 flex flex-col h-[calc(100dvh-80px)] md:h-[100dvh] overflow-hidden box-border">
      <StockPage />
    </main>
  );
}
