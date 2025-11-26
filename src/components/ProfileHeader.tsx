import { TrendingUp, TrendingDown, Smile } from 'lucide-react';

interface ProfileHeaderProps {
  name: string;
  avatar: string;
  score: number;
  weeklyHours: number;
  semesterHours: number;
}

export default function ProfileHeader({
  name,
  avatar,
  score,
  weeklyHours,
  semesterHours,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-8">
        <div className="relative">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500 shadow-xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-transparent to-purple-500" style={{ mixBlendMode: 'multiply', opacity: 0.3 }}></div>
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-yellow-400 w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg">⭐</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-green-500/10 p-2 rounded-full">
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div>
            <div className="text-6xl font-bold text-white">{score}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-4">
        <div className="bg-blue-800/50 rounded-2xl px-6 py-4 backdrop-blur-sm">
          <div className="text-white/60 text-sm mb-1">Your learning level points</div>
          <div className="text-white text-lg">
            {name}, you did a great job last week! <Smile className="inline" size={18} />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-4xl font-bold text-white">{weeklyHours}<span className="text-2xl">h</span></div>
            <div className="text-white/60 text-sm">Last week</div>
            <div className="mt-1">
              <svg width="60" height="20" className="inline-block">
                <polyline
                  points="0,15 15,12 30,8 45,10 60,5"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                <circle cx="60" cy="5" r="3" fill="#10b981" />
              </svg>
            </div>
          </div>

          <div className="text-right">
            <div className="text-4xl font-bold text-white">{semesterHours}<span className="text-2xl">h</span></div>
            <div className="text-white/60 text-sm">Last semester</div>
            <div className="mt-1">
              <svg width="60" height="20" className="inline-block">
                <polyline
                  points="0,5 15,8 30,12 45,10 60,15"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <circle cx="60" cy="15" r="3" fill="#ef4444" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
