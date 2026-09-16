import {
  IconWater, IconFood, IconMedicine, IconPain, IconHelp,
  IconCall, IconToilet, IconCold, IconHot, IconTired,
} from './icons.jsx'

const NEEDS = [
  { id: 'water', label: 'Water', Icon: IconWater },
  { id: 'food', label: 'Food', Icon: IconFood },
  { id: 'medicine', label: 'Medicine', Icon: IconMedicine },
  { id: 'pain', label: 'Pain', Icon: IconPain },
  { id: 'help', label: 'Help', Icon: IconHelp },
  { id: 'call', label: 'Call me', Icon: IconCall },
  { id: 'toilet', label: 'Toilet', Icon: IconToilet },
  { id: 'cold', label: 'Cold', Icon: IconCold },
  { id: 'hot', label: 'Hot', Icon: IconHot },
  { id: 'tired', label: 'Tired', Icon: IconTired },
]

export default function NeedGrid({ activeNeedId }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
      {NEEDS.map(({ id, label, Icon }) => {
        const active = id === activeNeedId
        return (
          <div
            key={id}
            className={`flex flex-col items-center gap-2 text-center border rounded-[20px] px-2.5 py-4 transition-colors duration-300 ${
              active ? 'bg-rose border-rose' : 'bg-white border-line'
            }`}
          >
            <Icon className={`w-[26px] h-[26px] ${active ? 'text-white' : 'text-rose-deep'}`} />
            <span className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink'}`}>{label}</span>
          </div>
        )
      })}
    </div>
  )
}
