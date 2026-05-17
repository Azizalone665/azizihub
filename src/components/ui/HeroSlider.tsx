'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const slides = [
  {
    id: 1,
    title: 'Summer Sale Extravaganza',
    subtitle: 'Up to 70% off on selected items',
    image: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1200&h=600&fit=crop',  // Shopping
    cta: 'Shop Now',
    link: '/products',
  },
  {
    id: 2,
    title: 'New Electronics Arrivals',
    subtitle: 'Latest gadgets at unbeatable prices',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=600&fit=crop', // Electronics
    cta: 'Explore',
    link: '/products?category=electronics',
  },
  {
    id: 3,
    title: 'Fashion Week Deals',
    subtitle: 'Trendy outfits for everyone',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&h=600&fit=crop', // Fashion
    cta: 'Discover',
    link: '/products?category=clothing',
  },
]

export default function HeroSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <div className="relative h-[500px] md:h-[600px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="relative h-full w-full">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-black/40 z-10" />
            <Image
              src={slides[current].image}
              alt={slides[current].title}
              fill
              className="object-cover"
              priority
            />
            {/* Content */}
            <div className="relative z-20 h-full flex items-center justify-center text-center text-white px-4">
              <div>
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-4xl md:text-6xl font-bold mb-4"
                >
                  {slides[current].title}
                </motion.h1>
                <motion.p
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg md:text-xl mb-8"
                >
                  {slides[current].subtitle}
                </motion.p>
                <motion.a
                  href={slides[current].link}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
                >
                  {slides[current].cta}
                </motion.a>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur-sm transition-colors"
      >
        <FiChevronLeft size={24} className="text-white" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 rounded-full p-2 backdrop-blur-sm transition-colors"
      >
        <FiChevronRight size={24} className="text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === current ? 'w-8 bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  )
}