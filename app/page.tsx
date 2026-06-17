import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/landing/NavBar'
import HeroSection from '@/components/landing/HeroSection'
import AboutSection from '@/components/landing/AboutSection'
import ServicesSection from '@/components/landing/ServicesSection'
import GallerySection from '@/components/landing/GallerySection'
import BeforeAfterSection from '@/components/landing/BeforeAfterSection'
import BookingSection from '@/components/landing/BookingSection'
import WhatsAppButton from '@/components/landing/WhatsAppButton'

export default async function Home() {
  // Fetch all site settings server-side — one DB call, no client waterfall
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('site_settings')
    .select('key, image_url')

  const s: Record<string, string | null> = {}
  for (const r of rows ?? []) s[r.key] = r.image_url

  const heroImage         = s.hero_image        ?? null
  const portrait          = s.about_portrait    ?? null
  // Default true — only hidden when explicitly set to 'false'
  const galleryEnabled    = s.gallery_enabled    !== 'false'
  const beforeAfterEnabled = s.before_after_enabled !== 'false'

  // Barber WhatsApp phone — single source of truth, editable in /admin/ajustes.
  // Falls back to the build-time env var, then a placeholder, so links never 404.
  const { data: bkRows } = await supabase
    .from('booking_settings')
    .select('value')
    .eq('key', 'whatsapp_phone')
    .maybeSingle()
  const whatsappPhone = bkRows?.value || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || ''

  return (
    <main className="overflow-x-hidden" style={{ backgroundColor: '#0E0B08' }}>
      <NavBar whatsappPhone={whatsappPhone} />
      <HeroSection heroImage={heroImage} />
      <AboutSection portrait={portrait} />
      <ServicesSection />
      {galleryEnabled    && <GallerySection />}
      {beforeAfterEnabled && <BeforeAfterSection />}
      <BookingSection whatsappPhone={whatsappPhone} />
      <WhatsAppButton phone={whatsappPhone} />
    </main>
  )
}
