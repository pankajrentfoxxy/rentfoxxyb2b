import { CartSync } from "@/components/storefront/CartSync";
import { CompareBar } from "@/components/storefront/CompareBar";
import { Footer } from "@/components/storefront/Footer";
import { Navbar } from "@/components/storefront/Navbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <CartSync />
      <Navbar />
      <div className="flex-1 pb-16">{children}</div>
      <Footer />
      <CompareBar />
    </div>
  );
}
