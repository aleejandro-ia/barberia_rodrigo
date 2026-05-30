export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span
          className="text-4xl font-bold tracking-tight"
          style={{ color: '#C9A96E' }}
        >
          R.
        </span>
        <div className="w-8 h-px animate-pulse" style={{ backgroundColor: '#C9A96E' }} />
      </div>
    </div>
  )
}
