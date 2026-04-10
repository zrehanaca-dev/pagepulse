import { Compass, Heart, Layers, Activity, User } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'discover',  label: 'Discover',  Icon: Compass  },
  { id: 'blinddate', label: 'BlindDate', Icon: Heart    },
  { id: 'stack',     label: 'Stack',     Icon: Layers   },
  { id: 'dna',       label: 'DNA',       Icon: Activity },
  { id: 'profile',   label: 'Profile',   Icon: User     },
]

export function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={`nav-item${active === id ? ' active' : ''}`}
          onClick={() => onChange(id)}
        >
          <Icon size={20} />
          {label}
        </button>
      ))}
    </nav>
  )
}
