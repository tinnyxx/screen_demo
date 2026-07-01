import type { ReactNode } from 'react'
import type { WeatherIconType } from './weatherTypes'
import styles from './WeatherIcon.module.scss'

interface WeatherIconProps {
  type: WeatherIconType
  className?: string
}

function IconShell({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <svg
      className={className ?? styles.icon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

function SunnyIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="4.5" fill="#F5C542" />
      <g stroke="#F5C542" strokeWidth="1.5" strokeLinecap="round">
        <line x1="12" y1="2.5" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="21.5" />
        <line x1="2.5" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="21.5" y2="12" />
        <line x1="5.3" y1="5.3" x2="7.1" y2="7.1" />
        <line x1="16.9" y1="16.9" x2="18.7" y2="18.7" />
        <line x1="5.3" y1="18.7" x2="7.1" y2="16.9" />
        <line x1="16.9" y1="7.1" x2="18.7" y2="5.3" />
      </g>
    </IconShell>
  )
}

function CloudyIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="8.5" cy="8" r="3.2" fill="#F5C542" />
      <path
        d="M7 18h10a4 4 0 0 0 .5-7.98A5.5 5.5 0 0 0 7.2 9.5 4.5 4.5 0 0 0 7 18z"
        fill="#93C5FD"
      />
    </IconShell>
  )
}

function OvercastIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        d="M5 16h14a3.5 3.5 0 0 0 .4-6.98A4.8 4.8 0 0 0 5.3 8.2 3.8 3.8 0 0 0 5 16z"
        fill="#8FA3B8"
      />
      <path
        d="M4 18.5h16"
        stroke="#8FA3B8"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </IconShell>
  )
}

function RainCloudIcon({
  className,
  drops,
}: {
  className?: string
  drops: Array<{ x: number; y: number; h: number }>
}) {
  return (
    <IconShell className={className}>
      <path
        d="M6 14h12a3.2 3.2 0 0 0 .4-6.4A4.4 4.4 0 0 0 6.2 6.8 3.4 3.4 0 0 0 6 14z"
        fill="#93C5FD"
      />
      <g stroke="#5B9FED" strokeWidth="1.4" strokeLinecap="round">
        {drops.map((drop) => (
          <line key={`${drop.x}-${drop.y}`} x1={drop.x} y1={drop.y} x2={drop.x - 0.8} y2={drop.y + drop.h} />
        ))}
      </g>
    </IconShell>
  )
}

function SnowCloudIcon({
  className,
  flakes,
}: {
  className?: string
  flakes: Array<{ x: number; y: number; r: number }>
}) {
  return (
    <IconShell className={className}>
      <path
        d="M6 13.5h12a3.2 3.2 0 0 0 .4-6.4A4.4 4.4 0 0 0 6.2 6.3 3.4 3.4 0 0 0 6 13.5z"
        fill="#B8C7D9"
      />
      <g fill="#E8F4FF">
        {flakes.map((flake) => (
          <circle key={`${flake.x}-${flake.y}`} cx={flake.x} cy={flake.y} r={flake.r} />
        ))}
      </g>
    </IconShell>
  )
}

function ThunderstormIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        d="M6 13h12a3.2 3.2 0 0 0 .4-6.4A4.4 4.4 0 0 0 6.2 5.8 3.4 3.4 0 0 0 6 13z"
        fill="#7B8FA8"
      />
      <path d="M13.2 12.8 11.4 16.8h2.2l-1.6 4.2 4.1-5.2h-2.3l1.4-3z" fill="#F5C542" />
    </IconShell>
  )
}

function SleetIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path
        d="M6 13h12a3.2 3.2 0 0 0 .4-6.4A4.4 4.4 0 0 0 6.2 6.1 3.4 3.4 0 0 0 6 13z"
        fill="#93C5FD"
      />
      <line x1="9" y1="15.5" x2="8.2" y2="18" stroke="#5B9FED" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="15.5" x2="11.2" y2="18" stroke="#5B9FED" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="15.2" cy="17.2" r="1" fill="#E8F4FF" />
      <circle cx="17.2" cy="15.8" r="0.8" fill="#E8F4FF" />
    </IconShell>
  )
}

function FogIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <path d="M5 8h14" stroke="#B8C7D9" strokeWidth="1.6" strokeLinecap="round" opacity="0.45" />
      <path d="M4 11.5h16" stroke="#D6E2EE" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M6 15h12" stroke="#B8C7D9" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <path d="M5 18.5h14" stroke="#D6E2EE" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
    </IconShell>
  )
}

function HazeIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="12" r="4.5" fill="#D7B160" opacity="0.85" />
      <path d="M4 17h16" stroke="#D7B160" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
      <path d="M5 19.5h14" stroke="#D7B160" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
    </IconShell>
  )
}

function SandIcon({ className }: { className?: string }) {
  return (
    <IconShell className={className}>
      <circle cx="12" cy="10.5" r="4.2" fill="#D7B160" opacity="0.75" />
      <path
        d="M4 18c2.5-1.2 5-1.8 8-1.8s5.5.6 8 1.8"
        stroke="#C99547"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M6 15.5h3" stroke="#C99547" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M15 16h3" stroke="#C99547" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </IconShell>
  )
}

const iconMap: Record<WeatherIconType, (props: { className?: string }) => ReactNode> = {
  sunny: SunnyIcon,
  cloudy: CloudyIcon,
  overcast: OvercastIcon,
  'light-rain': (props) =>
    RainCloudIcon({
      ...props,
      drops: [
        { x: 9, y: 15.5, h: 2.2 },
        { x: 12, y: 16, h: 2.2 },
        { x: 15, y: 15.5, h: 2.2 },
      ],
    }),
  'moderate-rain': (props) =>
    RainCloudIcon({
      ...props,
      drops: [
        { x: 8, y: 15, h: 3 },
        { x: 10.5, y: 15.5, h: 3 },
        { x: 13, y: 15, h: 3 },
        { x: 15.5, y: 15.5, h: 3 },
        { x: 18, y: 15, h: 3 },
      ],
    }),
  'heavy-rain': (props) =>
    RainCloudIcon({
      ...props,
      drops: [
        { x: 7, y: 14.5, h: 3.8 },
        { x: 9.5, y: 15, h: 3.8 },
        { x: 12, y: 14.5, h: 3.8 },
        { x: 14.5, y: 15, h: 3.8 },
        { x: 17, y: 14.5, h: 3.8 },
        { x: 19, y: 15, h: 3.8 },
      ],
    }),
  thunderstorm: ThunderstormIcon,
  'light-snow': (props) =>
    SnowCloudIcon({
      ...props,
      flakes: [
        { x: 9, y: 16.5, r: 0.9 },
        { x: 12, y: 17.2, r: 0.9 },
        { x: 15, y: 16.5, r: 0.9 },
      ],
    }),
  'moderate-snow': (props) =>
    SnowCloudIcon({
      ...props,
      flakes: [
        { x: 8, y: 16, r: 1 },
        { x: 10.5, y: 17, r: 1 },
        { x: 13, y: 16.2, r: 1 },
        { x: 15.5, y: 17, r: 1 },
        { x: 18, y: 16.2, r: 1 },
      ],
    }),
  'heavy-snow': (props) =>
    SnowCloudIcon({
      ...props,
      flakes: [
        { x: 7.5, y: 15.8, r: 1.1 },
        { x: 9.5, y: 17.2, r: 1.1 },
        { x: 11.5, y: 16, r: 1.1 },
        { x: 13.5, y: 17.3, r: 1.1 },
        { x: 15.5, y: 16, r: 1.1 },
        { x: 17.5, y: 17.2, r: 1.1 },
      ],
    }),
  sleet: SleetIcon,
  fog: FogIcon,
  haze: HazeIcon,
  sand: SandIcon,
}

export function WeatherIcon({ type, className }: WeatherIconProps) {
  const Icon = iconMap[type] ?? iconMap.sunny
  return <Icon className={className} />
}
