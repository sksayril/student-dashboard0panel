import { Settings } from 'lucide-react';
import { SkillCategory } from '../types/student';

interface SkillCardProps {
  skillpoints: number;
  improvement: number;
  skills: SkillCategory[];
}

export default function SkillCard({ skillpoints, improvement, skills }: SkillCardProps) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800">Your main skillset</h3>
          <p className="text-sm text-blue-600">
            YOU IMPROVED IT BY <span className="font-bold">{improvement} POINTS</span> LAST WEEK
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <Settings size={24} />
        </button>
      </div>

      <div className="flex items-center justify-center mb-8">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#6366f1"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${35 * 5.026} 502.6`}
              className="transition-all duration-500"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#fb923c"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${30 * 5.026} 502.6`}
              strokeDashoffset={`-${35 * 5.026}`}
              className="transition-all duration-500"
            />
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#a3e635"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${35 * 5.026} 502.6`}
              strokeDashoffset={`-${65 * 5.026}`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-gray-800">{skillpoints}</div>
            <div className="text-sm text-gray-500">Main skillpoints</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-8">
        {skills.map((skill, index) => (
          <div key={index} className="text-center">
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${
              skill.name === 'Graphic Design' ? 'bg-blue-500' :
              skill.name === 'UX / UI' ? 'bg-orange-400' :
              'bg-lime-400'
            }`}></div>
            <div className="text-sm font-medium text-gray-700">{skill.name}</div>
            <div className="text-sm text-gray-500">{skill.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
