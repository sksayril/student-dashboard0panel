import { useState, useEffect } from 'react';
import { Star, Clock, BookOpen, CheckCircle, PlayCircle, Filter, ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';
import { coursesApi } from '../api';
import { EnrolledCourseWithProgress } from '../api/types';
import { useToast } from './ToastContainer';
import { Skeleton, SkeletonCard } from './Skeleton';

interface EnrolledCoursesProps {
  userData?: any;
  onCourseClick?: (courseId: string) => void;
  onNavigateToAvailable?: () => void;
}

export default function EnrolledCourses({ userData, onCourseClick, onNavigateToAvailable }: EnrolledCoursesProps) {
  const { showError } = useToast();
  const [courses, setCourses] = useState<EnrolledCourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Filters state
  const [statusFilter, setStatusFilter] = useState<'active' | 'completed' | 'cancelled' | 'expired' | 'pending_payment' | 'reserved' | undefined>(undefined);

  // Fetch enrolled courses
  const fetchEnrolledCourses = async () => {
    setIsLoading(true);
    try {
      const response = await coursesApi.getEnrolledCoursesWithProgress({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter,
      });

      if (response.success && response.data) {
        setCourses(response.data.items);
        setPagination(response.data.pagination);
      } else {
        showError(response.message || 'Failed to load enrolled courses');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      showError('An error occurred while loading enrolled courses');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, statusFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination({ ...pagination, page: newPage });
    }
  };

  const handleStatusFilterChange = (status: typeof statusFilter) => {
    setStatusFilter(status);
    setPagination({ ...pagination, page: 1 }); // Reset to page 1 when filter changes
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      case 'pending_payment':
        return 'bg-yellow-100 text-yellow-700';
      case 'reserved':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Enrolled Courses</h1>
            <p className="text-gray-600">Track your progress and continue learning</p>
          </div>
          {onNavigateToAvailable && (
            <button
              onClick={onNavigateToAvailable}
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center gap-2"
            >
              <BookOpen size={20} />
              Browse Courses
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            </div>

            <button
              onClick={() => handleStatusFilterChange(undefined)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === undefined
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusFilterChange('active')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusFilterChange('completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => handleStatusFilterChange('pending_payment')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                statusFilter === 'pending_payment'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Payment
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} theme="light" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && courses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-xl mb-2">No enrolled courses found</p>
            <p className="text-gray-400">Start exploring courses to enroll!</p>
          </div>
        )}

        {/* Enrolled Courses Grid */}
        {!isLoading && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {courses.map((item) => {
                const { course, progress, enrollment } = item;
                return (
                  <div
                    key={enrollment._id}
                    onClick={() => onCourseClick?.(course._id)}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group"
                  >
                    {/* Course Header */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen size={64} className="text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(enrollment.status)}`}>
                          {enrollment.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {progress.isCompleted && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500 text-white">
                            COMPLETED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Course Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                          {course.category && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {course.category.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.shortDescription}</p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Progress</span>
                          <span className="text-sm font-semibold text-blue-600">{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              progress.isCompleted ? 'bg-blue-600' : 'bg-green-500'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                          <span>{progress.lessonsCompleted} / {progress.totalLessons} lessons completed</span>
                        </div>
                      </div>

                      {/* Course Stats */}
                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 border-t pt-4">
                        <div className="flex items-center gap-1">
                          <Star size={16} className="text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{course.rating.average.toFixed(1)}</span>
                          <span>({course.rating.count})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen size={16} />
                          <span>{course.lessonsCount} lessons</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{formatDuration(course.durationMinutes)}</span>
                        </div>
                      </div>

                      {/* Enrollment Info */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar size={14} />
                          <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                        </div>
                        {enrollment.completedAt && (
                          <div className="flex items-center gap-2 text-xs text-green-600">
                            <CheckCircle size={14} />
                            <span>Completed: {new Date(enrollment.completedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Last Accessed */}
                      {progress.lastAccessedAt && (
                        <div className="mt-2 text-xs text-gray-400">
                          Last accessed: {new Date(progress.lastAccessedAt).toLocaleDateString()}
                        </div>
                      )}

                      {/* Continue Learning Button */}
                      {!progress.isCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCourseClick?.(course._id);
                          }}
                          className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                          <PlayCircle size={18} />
                          {progress.lessonsCompleted > 0 ? 'Continue Learning' : 'Start Learning'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className={`p-2 rounded-lg ${
                    pagination.page === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-4 py-2 rounded-lg ${
                          pagination.page === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className={`p-2 rounded-lg ${
                    pagination.page === pagination.pages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-300'
                  }`}
                >
                  <ChevronRight size={20} />
                </button>

                <span className="text-sm text-gray-600 ml-4">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total courses)
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

