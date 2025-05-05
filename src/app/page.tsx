import Layout from "@/components/layout/Layout";
import Hero from "@/components/home/Hero";
import ServicesSection from "@/components/home/ServicesSection";
import ProductsSection from "@/components/home/ProductsSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CtaSection from "@/components/home/CtaSection";

export default function Home() {
  return (
    <Layout>
      <Hero />
      <ServicesSection />
      <ProductsSection />
      <TestimonialsSection />
      <CtaSection />
    </Layout>
  );
}