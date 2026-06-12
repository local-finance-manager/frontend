import { icons, type LucideProps } from 'lucide-react'

type CategoryIconProps = LucideProps & {
  name: string
}

function toIconKey(name: string): keyof typeof icons {
  return name
    .split(/[-_\s]+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join('') as keyof typeof icons
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  const key = name ? toIconKey(name) : 'Tag'
  const Icon = icons[key] ?? icons['Tag']
  return <Icon {...props} />
}
