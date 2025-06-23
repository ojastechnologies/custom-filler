import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import Products from "@/components/Products";
import CtaSection from "@/components/home/CtaSection";

export default function Home() {
  return (
    <Layout>
      <Hero />
      <ServicesSection />
      <Products 
        isHomeSection={true}
        maxProducts={8}
        title="Featured Products"
        subtitle="Explore our specialized aerosol products with exclusive deals"
        showViewAllLink={true}
      />
      {/* <TestimonialsSection /> */}
      <CtaSection />
    </Layout>
  );
}