import { useState, useEffect } from 'react';
import { Star, Clock, Users, BookOpen, Filter, ChevronLeft, ChevronRight, Heart, Award } from 'lucide-react';
import { coursesApi } from '../api';
import { Course, CourseFiltersRequest } from '../api/types';
import { useToast } from './ToastContainer';
import { SkeletonCourseCard } from './Skeleton';

interface CoursesProps {
  userData?: any;
  onCourseClick?: (courseId: string) => void;
  onNavigateToEnrolled?: () => void;
}

export default function Courses({ userData, onCourseClick, onNavigateToEnrolled }: CoursesProps) {
  const { showError } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

  // Filters state
  const [filters, setFilters] = useState<CourseFiltersRequest>({
    page: 1,
    limit: 12,
    sort: 'rating',
  });

  // Fetch courses
  const fetchCourses = async () => {
    setIsLoading(true);
    try {
      // Map student level to course level filter (only if level filter is not manually set)
      let levelFilter = filters.level;
      
      if (!levelFilter && userData?.studentLevel) {
        const studentLevel = userData.studentLevel;
        const levelValue = typeof studentLevel === 'string' ? studentLevel : studentLevel.name || studentLevel.id;
        levelFilter = coursesApi.mapStudentLevelToCourseLevel(levelValue);
      }

      const requestFilters: CourseFiltersRequest = {
        ...filters,
        level: levelFilter,
      };

      const response = await coursesApi.getCourses(requestFilters);

      if (response.success && response.data) {
        setCourses(response.data.items);
        setPagination(response.data.pagination);
      } else {
        showError(response.message || 'Failed to load courses');
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      showError('An error occurred while loading courses');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.limit, filters.level, filters.sort, filters.minRating, filters.maxRating, filters.minPrice, filters.maxPrice, userData?.studentLevel]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters({ ...filters, page: newPage });
    }
  };

  const handleFilterChange = (key: keyof CourseFiltersRequest, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 }); // Reset to page 1 when filters change
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const formatPrice = (price: number, currency: string): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Courses</h1>
              <p className="text-gray-600">Discover and enroll in courses tailored to your learning journey</p>
            </div>
            {onNavigateToEnrolled && (
              <button
                onClick={onNavigateToEnrolled}
                className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-all font-semibold flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <BookOpen size={20} />
                My Courses
              </button>
            )}
          </div>
          
          {/* Stats Bar */}
          {pagination.total > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen size={18} className="text-blue-600" />
                  <span className="text-gray-700">
                    <span className="font-bold text-gray-900">{pagination.total}</span> courses available
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-gray-600">
                  Page <span className="font-semibold text-gray-900">{pagination.page}</span> of {pagination.pages}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">Filters</span>
            </div>

            <select
              value={filters.level || 'all'}
              onChange={(e) => handleFilterChange('level', e.target.value === 'all' ? undefined : e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select
              value={filters.sort || 'rating'}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="rating">Sort by Rating</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min Rating"
                min="0"
                max="5"
                value={filters.minRating || ''}
                onChange={(e) => handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <span className="text-gray-500">to</span>
              <input
                type="number"
                placeholder="Max Rating"
                min="0"
                max="5"
                value={filters.maxRating || ''}
                onChange={(e) => handleFilterChange('maxRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <SkeletonCourseCard key={i} />
            ))}
          </div>
        )}

        {/* Courses Grid */}
        {!isLoading && courses.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-xl">No courses found</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters</p>
          </div>
        )}

        {!isLoading && courses.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {courses.map((course) => (
                <div
                  key={course._id}
                  onClick={() => onCourseClick?.(course._id)}
                  className="bg-white rounded-xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer border border-gray-100"
                >
                  {/* Course Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 overflow-hidden">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                        <BookOpen size={48} className="text-white opacity-80" />
                      </div>
                    )}
                    
                    {/* Level Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold shadow-lg ${
                        course.level === 'beginner' ? 'bg-green-500 text-white' :
                        course.level === 'intermediate' ? 'bg-yellow-500 text-white' :
                        course.level === 'advanced' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {course.level === 'all' ? 'All Levels' : course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </span>
                    </div>

                    {/* Best Seller Badge (if high rating) */}
                    {course.rating.average >= 4.5 && course.rating.count > 100 && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-md shadow-lg flex items-center gap-1">
                          <Award size={12} />
                          BEST SELLER
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-5">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                      {course.title}
                    </h3>
                    
                    {/* Instructor */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                        {course.tutorId.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">{course.tutorId.name}</span>
                    </div>

                    {/* Course Stats */}
                    <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold text-gray-900">{course.rating.average.toFixed(1)}</span>
                        <span className="text-gray-500">({course.rating.count})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} className="text-gray-400" />
                        <span>{course.rating.count}</span>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center gap-3 mb-4 text-xs text-gray-500 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-1">
                        <BookOpen size={14} />
                        <span>{course.lessonsCount} lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{formatDuration(course.durationMinutes)}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{formatPrice(course.price, course.currency)}</p>
                        {course.price === 0 && (
                          <p className="text-xs text-green-600 font-semibold mt-0.5">Free</p>
                        )}
                      </div>
                      {course.price > 0 && (
                        <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold">
                          Enroll Now
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        {course.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                        {course.tags.length > 2 && (
                          <span className="px-2 py-0.5 text-gray-400 text-xs">
                            +{course.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
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


