import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0E0B08', color: '#F2EDE7' }}>
      <AdminNav />
      <main className="max-w-6xl mx-auto px-5 py-10">
        {children}
      </main>
    </div>
  )
}
