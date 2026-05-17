'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiTruck, FiShield, FiHeadphones, FiRefreshCw, FiAward, FiUsers, FiPackage, FiClock } from 'react-icons/fi';
import { createClient } from '@/lib/supabase/client';

export default function AboutPage() {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'AziziHub',
    founded: '2024',
    mission: 'To provide quality products at unbeatable prices with exceptional customer service.',
    vision: 'To become Pakistan\'s most trusted online marketplace.',
    story: 'AziziHub was founded with a simple vision: to make online shopping easy, affordable, and reliable for everyone in Pakistan. What started as a small team of passionate individuals has grown into a platform serving thousands of happy customers across the country.',
    values: [
      { title: 'Customer First', description: 'We put our customers at the heart of everything we do.' },
      { title: 'Quality Assurance', description: 'Every product is carefully selected and vetted.' },
      { title: 'Fast Delivery', description: 'We ensure quick and reliable shipping nationwide.' },
      { title: 'Secure Payments', description: 'Your transactions and data are always protected.' },
    ],
  });
  const [stats, setStats] = useState({
    customers: 0,
    products: 0,
    deliveries: 0,
    years: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchCompanyInfo();
    fetchStats();
  }, []);

  const fetchCompanyInfo = async () => {
    const { data } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['company_mission', 'company_vision', 'company_story', 'company_founded']);
    if (data) {
      const info: any = {};
      data.forEach((item) => {
        info[item.key] = item.value?.value;
      });
      setCompanyInfo((prev) => ({
        ...prev,
        mission: info.company_mission || prev.mission,
        vision: info.company_vision || prev.vision,
        story: info.company_story || prev.story,
        founded: info.company_founded || prev.founded,
      }));
    }
  };

  const fetchStats = async () => {
    const { count: customers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: products } = await supabase.from('products').select('*', { count: 'exact', head: true });
    const { count: orders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    setStats({
      customers: customers || 0,
      products: products || 0,
      deliveries: orders || 0,
      years: new Date().getFullYear() - parseInt(companyInfo.founded) || 1,
    });
  };

  const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, transition: { duration: 0.6 }, viewport: { once: true } };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.h1 className="text-5xl md:text-6xl font-bold mb-4" {...fadeUp}>About AziziHub</motion.h1>
          <motion.p className="text-xl md:text-2xl max-w-3xl mx-auto opacity-90" {...fadeUp} transition={{ delay: 0.2 }}>
            Your trusted partner in online shopping – quality, affordability, and reliability.
          </motion.p>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: FiUsers, label: 'Happy Customers', value: stats.customers.toLocaleString() },
            { icon: FiPackage, label: 'Products Available', value: stats.products.toLocaleString() },
            { icon: FiTruck, label: 'Orders Delivered', value: stats.deliveries.toLocaleString() },
            { icon: FiClock, label: 'Years of Trust', value: stats.years },
          ].map((stat, idx) => (
            <motion.div key={stat.label} className="p-4" {...fadeUp} transition={{ delay: idx * 0.1 }}>
              <stat.icon className="w-10 h-10 text-primary-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-gray-800">{stat.value}+</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12">
          <motion.div className="bg-white p-8 rounded-2xl shadow-md" {...fadeUp}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">{companyInfo.mission}</p>
          </motion.div>
          <motion.div className="bg-white p-8 rounded-2xl shadow-md" {...fadeUp} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">{companyInfo.vision}</p>
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <motion.div {...fadeUp}>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Story</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{companyInfo.story}</p>
            <p className="text-gray-600 leading-relaxed">
              Today, AziziHub is proud to serve customers across Pakistan, offering a wide range of products from electronics and fashion to home essentials. We continue to innovate and improve, always with our customers in mind.
            </p>
          </motion.div>
          <motion.div className="relative h-80 rounded-2xl overflow-hidden shadow-xl" {...fadeUp} transition={{ delay: 0.2 }}>
            <Image src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop" alt="Team" fill className="object-cover" />
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2 className="text-3xl font-bold text-center text-gray-800 mb-12" {...fadeUp}>Our Core Values</motion.h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {companyInfo.values.map((value, idx) => (
              <motion.div key={value.title} className="bg-white p-6 rounded-xl shadow-md text-center" {...fadeUp} transition={{ delay: idx * 0.1 }}>
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {idx === 0 && <FiAward className="w-8 h-8 text-primary-600" />}
                  {idx === 1 && <FiShield className="w-8 h-8 text-primary-600" />}
                  {idx === 2 && <FiTruck className="w-8 h-8 text-primary-600" />}
                  {idx === 3 && <FiHeadphones className="w-8 h-8 text-primary-600" />}
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-500 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <motion.h2 className="text-3xl font-bold mb-4" {...fadeUp}>Ready to experience AziziHub?</motion.h2>
          <motion.p className="text-xl mb-8 opacity-90" {...fadeUp} transition={{ delay: 0.2 }}>
            Join thousands of happy customers shopping with us every day.
          </motion.p>
          <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
            <Link href="/products" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
              Start Shopping
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}