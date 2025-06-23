// This file was moved from /services/page.tsx

"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/context/CartContext";
import { fetchProducts } from "@/services/productsService";import Card from "@/components/ui/Card";
import { ProductType } from "@/types/product";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
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
