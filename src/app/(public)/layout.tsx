import { CartSync } from "@/components/storefront/CartSync";
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
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
