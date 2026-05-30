'use client'

import ScheduleManager from '@/components/admin/ScheduleManager'

export default function AdminSchedulePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6">Horarios</h1>
      <ScheduleManager />
    </div>
  )
}
