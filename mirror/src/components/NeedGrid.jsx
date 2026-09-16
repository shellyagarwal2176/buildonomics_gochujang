import {
  IconAfraid, IconAgree, IconHelp, IconBad, IconDoctor, IconHome,
  IconHowAreYou, IconFood, IconCall, IconPain, IconProblem, IconSick,
  IconStand, IconStop, IconWater, IconUnderstand, IconWarn, IconYou,
} from './icons.jsx'

// One card per sign in the frozen 19-word vocabulary (ml/src/labels.py) —
// ids are lowercase to match App.jsx's activeNeedId (alert.sign.toLowerCase()).
const NEEDS = [
  { id: 'afraid', label: 'Afraid', Icon: IconAfraid },
  { id: 'agree', label: 'Agree', Icon: IconAgree },
  { id: 'assistance', label: 'Assistance', Icon: IconHelp },
  { id: 'bad', label: 'Bad', Icon: IconBad },
  { id: 'doctor', label: 'Doctor', Icon: IconDoctor },
  { id: 'good morning', label: 'Good morning', Icon: IconHowAreYou },
  { id: 'home', label: 'Home', Icon: IconHome },
  { id: 'how are you', label: 'How are you', Icon: IconHowAreYou },
  { id: 'hungry', label: 'Hungry', Icon: IconFood },
  { id: 'i need help', label: 'I need help', Icon: IconCall },
  { id: 'pain', label: 'Pain', Icon: IconPain },
  { id: 'problem', label: 'Problem', Icon: IconProblem },
  { id: 'sick', label: 'Sick', Icon: IconSick },
  { id: 'stand', label: 'Stand', Icon: IconStand },
  { id: 'stop', label: 'Stop', Icon: IconStop },
  { id: 'thirsty', label: 'Thirsty', Icon: IconWater },
  { id: 'understand', label: 'Understand', Icon: IconUnderstand },
  { id: 'warn', label: 'Warn', Icon: IconWarn },
  { id: 'you', label: 'You', Icon: IconYou },
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
