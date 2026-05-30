'use client'

import ScheduleManager from '@/components/admin/ScheduleManager'

export default function AdminSchedulePage() {
  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: '#C9A96E' }}>
          Panel Admin
        </p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#F2EDE7' }}>
          Horarios
        </h1>
      </div>
      <ScheduleManager />
    </div>
  )
}
