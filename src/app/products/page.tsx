// This file was moved from /services/page.tsx

"use client";

import React from "react";
import Layout from "@/components/layout/Layout";
import Products from "@/components/Products";
export default function ProductsPage() {
  return (
    <Layout>
      <Products 
        isHomeSection={false}
        title="All Products"
        subtitle="Quality aerosol products for various applications"
        showViewAllLink={false}
      />
    </Layout>
  );
}
