import { Plus } from 'lucide-react';
import { Teammate } from '../types/student';

interface TeammatesPanelProps {
  teammates: Teammate[];
}

export default function TeammatesPanel({ teammates }: TeammatesPanelProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl p-6 shadow-md">
      <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-full font-medium mb-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-2">
        <Plus size={20} />
        Improve your skill
      </button>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
            My Teammates
          </h3>
          <button className="text-gray-400 hover:text-gray-600">
            <Plus size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {teammates.map((teammate) => (
            <div
              key={teammate.id}
              className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white transition-colors cursor-pointer"
            >
              <img
                src={teammate.avatar}
                alt={teammate.name}
                className="w-12 h-12 rounded-full object-cover shadow-md"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{teammate.name}</div>
              </div>
              <div className="text-xl font-bold text-gray-700">{teammate.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
