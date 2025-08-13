import StockPage from "@/components/pages/StockPage";

export default function Page() {
  return (
    <main className="px-6 pt-2 md:pt-4 pb-6 flex flex-col min-h-[calc(100dvh-80px)] md:h-[100dvh] overflow-visible md:overflow-hidden box-border">
      <StockPage />
    </main>
  );
}
