import { Menu, Play } from 'lucide-react';
import { Lesson } from '../types/student';

interface LessonCardProps {
  lessons: Lesson[];
  hoursNeeded: number;
}

export default function LessonCard({ lessons, hoursNeeded }: LessonCardProps) {
  return (
    <div className="bg-white rounded-3xl p-8 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
            <Menu className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Next lessons</h3>
            <p className="text-sm text-blue-500">
              YOU WILL NEED <span className="font-bold">{hoursNeeded} HOURS</span> THIS WEEK
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group"
          >
            <div className={`w-12 h-12 ${lesson.color} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Play className="text-white" size={20} fill="white" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">{lesson.title}</div>
              <div className="text-sm text-gray-500">{lesson.category}</div>
            </div>
            <div className="text-sm text-gray-500">{lesson.duration}</div>
          </div>
        ))}
      </div>

      <button className="w-full mt-6 py-3 text-gray-400 hover:text-gray-600 font-medium text-sm uppercase tracking-wider transition-colors">
        View Learning Plan
      </button>
    </div>
  );
}
