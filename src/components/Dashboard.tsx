import ProfileHeader from './ProfileHeader';
import SkillCard from './SkillCard';
import LessonCard from './LessonCard';
import TeammatesPanel from './TeammatesPanel';
import { StudentData } from '../types/student';

interface DashboardProps {
  data: StudentData;
  userData?: any;
}

export default function Dashboard({ data, userData }: DashboardProps) {
  // Use real user data if available, otherwise use mock data
  const displayName = userData?.name || data.name;
  const displayAvatar = userData?.profileImage || data.avatar;
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {userData && (
          <div className="mb-4 bg-blue-800/30 backdrop-blur-sm rounded-2xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Logged in as {userData.name}</p>
                <p className="text-blue-200 text-sm">{userData.email}</p>
              </div>
            </div>
            {userData.studentLevel && (
              <div className="bg-white/10 px-4 py-2 rounded-full">
                <span className="text-white text-sm font-medium">{userData.studentLevel.name || userData.studentLevel}</span>
              </div>
            )}
          </div>
        )}
        
        <ProfileHeader
          name={displayName}
          avatar={displayAvatar}
          score={data.score}
          weeklyHours={data.weeklyHours}
          semesterHours={data.semesterHours}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SkillCard
              skillpoints={data.mainSkillpoints}
              improvement={data.skillImprovement}
              skills={data.skills}
            />
            <LessonCard lessons={data.nextLessons} hoursNeeded={3.5} />
          </div>

          <div>
            <TeammatesPanel teammates={data.teammates} />
          </div>
        </div>
      </div>
    </div>
  );
}
