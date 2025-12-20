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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      {showScrollToTop && <ScrollToTop />}
    </div>
  );
};

export default Layout;
