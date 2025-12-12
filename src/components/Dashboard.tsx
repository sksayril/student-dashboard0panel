import { useState, useEffect } from 'react';
import ProfileHeader from './ProfileHeader';
import SkillCard from './SkillCard';
import LessonCard from './LessonCard';
import { Skeleton, SkeletonStats, SkeletonProfile } from './Skeleton';
import { StudentData } from '../types/student';
import { coursesApi } from '../api';
import { StudentDashboardResponse } from '../api/types';
import { useToast } from './ToastContainer';
import { BookOpen, TrendingUp, Clock, Award, CheckCircle, BarChart3 } from 'lucide-react';

interface DashboardProps {
  data: StudentData; // Fallback mock data
  userData?: any;
  onCourseClick?: (courseId: string) => void;
}

export default function Dashboard({ data, userData, onCourseClick }: DashboardProps) {
  const { showError } = useToast();
  const [dashboardData, setDashboardData] = useState<StudentDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await coursesApi.getStudentDashboard();

      if (response.success && response.data) {
        setDashboardData(response.data);
      } else {
        // Use mock data if API fails
        console.warn('Failed to fetch dashboard data, using mock data:', response.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use mock data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Transform API data to component format
  const transformDashboardData = (): StudentData => {
    if (!dashboardData) return data;

    const { overview, enrolledCourses, progress } = dashboardData;

    // Calculate score based on average completion and quiz score
    const score = Math.round((overview.averageCourseCompletion + overview.averageQuizScore) / 2);

    // Transform enrolled courses to next lessons format
    const nextLessons = enrolledCourses
      .filter(course => course.enrollment.status === 'active' && !course.progress.isCompleted)
      .slice(0, 4)
      .map((course, index) => ({
        id: course.course._id,
        title: course.course.title,
        category: course.course.category?.name || 'General',
        duration: formatTimeFromMinutes(course.progress.totalLessons * 30), // Estimate 30 min per lesson
        color: getColorForIndex(index),
      }));

    // Transform categories to skills
    const categoryMap = new Map<string, number>();
    enrolledCourses.forEach(course => {
      if (course.course.category) {
        const categoryName = course.course.category.name;
        const current = categoryMap.get(categoryName) || 0;
        categoryMap.set(categoryName, current + course.progress.percentage);
      }
    });

    const skills = Array.from(categoryMap.entries())
      .map(([name, totalPercentage], index) => ({
        name,
        percentage: Math.round(totalPercentage / enrolledCourses.length),
        color: getColorForSkill(index),
      }))
      .slice(0, 3);

    // Calculate hours from minutes
    const weeklyHours = overview.totalTimeSpentMinutes / 60 / 4; // Approximate weekly
    const semesterHours = overview.totalTimeSpentMinutes / 60;

    return {
      name: userData?.name || data.name,
      avatar: userData?.profileImage || data.avatar,
      score,
      weeklyHours: Math.round(weeklyHours * 10) / 10,
      semesterHours: Math.round(semesterHours),
      skillImprovement: dashboardData.growth.completionGrowth,
      mainSkillpoints: progress.overallCompletion,
      teammates: [], // Teammates panel removed
      nextLessons: nextLessons.length > 0 ? nextLessons : data.nextLessons,
      skills: skills.length > 0 ? skills : data.skills,
    };
  };

  const formatTimeFromMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')} h`;
    }
    return `${mins} m`;
  };

  const formatLastLogin = (lastLogin: string): string => {
    try {
      const date = new Date(lastLogin);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        // Format as date
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    } catch (error) {
      return lastLogin;
    }
  };

  const getColorForIndex = (index: number): string => {
    const colors = ['bg-purple-500', 'bg-orange-400', 'bg-lime-400', 'bg-pink-400'];
    return colors[index % colors.length];
  };

  const getColorForSkill = (index: number): string => {
    const colors = ['text-blue-500', 'text-orange-400', 'text-lime-400', 'text-pink-400', 'text-purple-500'];
    return colors[index % colors.length];
  };

  const displayData = transformDashboardData();
  const displayName = userData?.name || displayData.name;
  const displayAvatar = userData?.profileImage || displayData.avatar;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
        <div className="max-w-7xl mx-auto">
          <SkeletonStats theme="blue" />
          <SkeletonProfile theme="blue" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Skeleton variant="text" width="50%" theme="blue" className="mb-4 h-6 bg-white/40" />
              <Skeleton variant="text" width="100%" theme="blue" className="mb-2 bg-white/40" />
              <Skeleton variant="text" width="80%" theme="blue" className="mb-4 bg-white/40" />
              <Skeleton variant="rounded" height={150} theme="blue" className="bg-white/40" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Skeleton variant="text" width="50%" theme="blue" className="mb-4 h-6 bg-white/40" />
              <Skeleton variant="text" width="100%" theme="blue" className="mb-2 bg-white/40" />
              <Skeleton variant="text" width="80%" theme="blue" className="mb-4 bg-white/40" />
              <Skeleton variant="rounded" height={150} theme="blue" className="bg-white/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 p-8">
      <div className="max-w-7xl mx-auto">
        {userData && (
          <div className="mb-4 bg-blue-800/30 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold">Logged in as {userData.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-blue-200 text-sm">{userData.email}</p>
                  {userData.studentId && (
                    <>
                      <span className="text-blue-300">•</span>
                      <p className="text-blue-200 text-sm font-medium">ID: {userData.studentId}</p>
                    </>
                  )}
                  {userData.lastLogin && (
                    <>
                      <span className="text-blue-300">•</span>
                      <p className="text-blue-200 text-sm">
                        Last login: {formatLastLogin(userData.lastLogin)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
            {userData.studentLevel && (
              <div className="bg-white/10 px-4 py-2 rounded-full">
                <span className="text-white text-sm font-medium">{userData.studentLevel.name || userData.studentLevel}</span>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Overview Stats */}
        {dashboardData && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={20} className="text-blue-300" />
                <span className="text-blue-200 text-xs">Total Courses</span>
              </div>
              <p className="text-2xl font-bold text-white">{dashboardData.overview.totalCourses}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-green-300" />
                <span className="text-blue-200 text-xs">Active</span>
              </div>
              <p className="text-2xl font-bold text-white">{dashboardData.overview.activeCourses}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={20} className="text-yellow-300" />
                <span className="text-blue-200 text-xs">Completed</span>
              </div>
              <p className="text-2xl font-bold text-white">{dashboardData.overview.completedCourses}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={20} className="text-purple-300" />
                <span className="text-blue-200 text-xs">Lessons</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {dashboardData.overview.completedLessons}/{dashboardData.overview.totalLessons}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Award size={20} className="text-pink-300" />
                <span className="text-blue-200 text-xs">Quiz Score</span>
              </div>
              <p className="text-2xl font-bold text-white">{dashboardData.overview.averageQuizScore}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} className="text-orange-300" />
                <span className="text-blue-200 text-xs">Time Spent</span>
              </div>
              <p className="text-2xl font-bold text-white">{Math.round(dashboardData.overview.totalTimeSpentMinutes / 60)}h</p>
            </div>
          </div>
        )}
        
        <ProfileHeader
          name={displayName}
          avatar={displayAvatar}
          score={displayData.score}
          weeklyHours={displayData.weeklyHours}
          semesterHours={displayData.semesterHours}
        />

        <div className="space-y-6">
          <SkillCard
            skillpoints={displayData.mainSkillpoints}
            improvement={displayData.skillImprovement}
            skills={displayData.skills}
          />
          <LessonCard lessons={displayData.nextLessons} hoursNeeded={3.5} />
        </div>

        {/* Enrolled Courses Section */}
        {dashboardData && dashboardData.enrolledCourses.length > 0 && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">My Enrolled Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.enrolledCourses.slice(0, 6).map((item) => {
                const { course, progress, enrollment } = item;
                return (
                  <div
                    key={enrollment._id}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => onCourseClick?.(course._id)}
                  >
                    {course.thumbnailUrl && (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}
                    <h3 className="text-white font-semibold mb-2 line-clamp-2">{course.title}</h3>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-blue-200 text-xs">Progress</span>
                        <span className="text-white text-xs font-semibold">{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-1.5">
                        <div
                          className="bg-green-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-blue-200">
                      <span>{progress.lessonsCompleted}/{progress.totalLessons} lessons</span>
                      <span className={`px-2 py-1 rounded ${
                        enrollment.status === 'completed' ? 'bg-green-500/30 text-green-300' :
                        enrollment.status === 'active' ? 'bg-blue-500/30 text-blue-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
