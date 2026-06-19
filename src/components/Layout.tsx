import Navbar from "./Navbar";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
  showScrollToTop?: boolean;
}

const Layout = ({ children, showFooter = true, showScrollToTop = true }: LayoutProps) => {
  return (
    <div className="min-h-dvh flex flex-col bg-background text-foreground">
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido principal
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      {showFooter && <Footer />}
      {showScrollToTop && <ScrollToTop />}
    </div>
  );
};

export default Layout;
