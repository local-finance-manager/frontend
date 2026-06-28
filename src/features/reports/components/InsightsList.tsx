import { Lightbulb } from 'lucide-react'

export function InsightsList({ insights }: { insights: string[] }) {
  if (!insights || insights.length === 0) return null
  return (
    <div className="rounded-lg border border-c-border bg-c-surface p-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-c-text-2">
        <Lightbulb size={15} className="text-amber-500" />
        Insights
      </h3>
      <ul className="space-y-1.5">
        {insights.map((t, i) => (
          <li key={i} className="flex gap-2 text-sm text-c-text-2">
            <span className="text-amber-500">•</span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}
