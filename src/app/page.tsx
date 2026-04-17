import Header from "@/components/Header";
import HeroBrands from "@/components/HeroBrands";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HeroBrands />
      </main>
      <div className="fixed bottom-6 left-9 z-50">
        <a href="https://www.brightdigital.co" target="_blank" rel="noopener noreferrer" className="text-white text-[10px] tracking-wide hover:text-white/70 transition-colors">
          ©2026 brightDigital LLC
        </a>
      </div>
    </>
  );
}
