import NavBar from '@/components/landing/NavBar'
import HeroSection from '@/components/landing/HeroSection'
import AboutSection from '@/components/landing/AboutSection'
import ServicesSection from '@/components/landing/ServicesSection'
import GallerySection from '@/components/landing/GallerySection'
import BeforeAfterSection from '@/components/landing/BeforeAfterSection'
import BookingSection from '@/components/landing/BookingSection'
import WhatsAppButton from '@/components/landing/WhatsAppButton'

export default function Home() {
  return (
    <main className="overflow-x-hidden bg-[#0A0A0A]">
      <NavBar />
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <GallerySection />
      <BeforeAfterSection />
      <BookingSection />
      <WhatsAppButton />
    </main>
  )
}
