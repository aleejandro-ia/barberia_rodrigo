'use client'

import ScheduleDesigner from '@/components/admin/schedule/ScheduleDesigner'

export default function AdminSchedulePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-0 pb-24 md:pb-8">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Horarios
        </h1>
        <p className="text-sm mt-1" style={{ color: '#7A7268' }}>
          Elige días en el calendario y toca las horas para abrirlas o cerrarlas.
        </p>
      </div>
      <ScheduleDesigner />
    </div>
  )
}
