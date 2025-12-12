import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, Users, BookOpen, CheckCircle, PlayCircle, FileText, Download, Calendar } from 'lucide-react';
import { coursesApi } from '../api';
import { CourseDetailsResponse, Lesson, CourseProgressResponse } from '../api/types';
import { useToast } from './ToastContainer';
import LessonViewer from './LessonViewer';
import { Skeleton, SkeletonCard } from './Skeleton';

interface CourseDetailProps {
  courseId: string;
  userData?: any;
  onBack: () => void;
  onEnrollmentSuccess?: () => void;
}

export default function CourseDetail({ courseId, userData, onBack, onEnrollmentSuccess }: CourseDetailProps) {
  const { showError, showSuccess } = useToast();
  const [courseData, setCourseData] = useState<CourseDetailsResponse | null>(null);
  const [progressData, setProgressData] = useState<CourseProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(-1);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  // Fetch progress separately if enrolled
  useEffect(() => {
    const fetchProgress = async () => {
      if (courseData?.isEnrolled) {
        try {
          const progressResponse = await coursesApi.getCourseProgress(courseId);
          if (progressResponse.success && progressResponse.data) {
            setProgressData(progressResponse.data);
            // Also update course data enrollment progress
            setCourseData(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                enrollment: {
                  ...prev.enrollment!,
                  progress: progressResponse.data!.progress,
                },
              };
            });
          }
        } catch (error) {
          console.error('Error fetching course progress:', error);
        }
      }
    };

    if (courseData?.isEnrolled) {
      fetchProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, courseData?.isEnrolled]);

  const fetchCourseDetails = async () => {
    setIsLoading(true);
    try {
      const response = await coursesApi.getCourseDetails(courseId);

      if (response.success && response.data) {
        setCourseData(response.data);
        // Expand first section by default
        if (response.data.sections.length > 0) {
          setExpandedSections(new Set([response.data.sections[0]._id]));
        }
      } else {
        showError(response.message || 'Failed to load course details');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      showError('An error occurred while loading course details');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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

  const isLessonCompleted = (lessonId: string): boolean => {
    // First check progress data from API (more accurate)
    if (progressData) {
      const lesson = progressData.lessons.find(l => l._id === lessonId);
      if (lesson) {
        return lesson.isCompleted;
      }
    }
    // Fallback to enrollment progress
    if (courseData?.enrollment?.progress?.completedLessons) {
      return courseData.enrollment.progress.completedLessons.includes(lessonId);
    }
    return false;
  };

  // Get lessons with progress data merged
  const getLessonsWithProgress = () => {
    if (!courseData) return [];
    
    // If we have progress data, merge it with course lessons
    if (progressData) {
      return courseData.lessons.map(lesson => {
        const progressLesson = progressData.lessons.find(p => p._id === lesson._id);
        return {
          ...lesson,
          isCompleted: progressLesson?.isCompleted || false,
        };
      });
    }
    
    // Otherwise use course data with enrollment progress
    return courseData.lessons.map(lesson => ({
      ...lesson,
      isCompleted: isLessonCompleted(lesson._id),
    }));
  };

  // Get sections with progress data merged
  const getSectionsWithProgress = (): Array<CourseSection & { lessonsCount: number; completedLessons: number; completionPercentage: number }> => {
    if (!courseData) return [];
    
    return courseData.sections.map(section => {
      const lessonsWithProgress = section.lessons.map(lesson => ({
        ...lesson,
        isCompleted: isLessonCompleted(lesson._id),
      }));
      
      const completedCount = lessonsWithProgress.filter(l => l.isCompleted).length;
      const totalCount = lessonsWithProgress.length;
      
      return {
        ...section,
        lessons: lessonsWithProgress,
        lessonsCount: totalCount,
        completedLessons: completedCount,
        completionPercentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      };
    });
  };

  const handleLessonClick = (lesson: Lesson) => {
    // Check if user is enrolled or if it's a preview lesson
    if (!courseData?.isEnrolled && !lesson.isPreview) {
      showError('Please enroll in the course to access this lesson');
      return;
    }

    // Find the lesson index in the all lessons array
    const index = courseData?.lessons.findIndex(l => l._id === lesson._id) ?? -1;
    setSelectedLessonIndex(index);
    setSelectedLesson(lesson);
  };

  const handleNextLesson = () => {
    if (!courseData || selectedLessonIndex < 0) return;
    
    const nextIndex = selectedLessonIndex + 1;
    if (nextIndex < courseData.lessons.length) {
      setSelectedLessonIndex(nextIndex);
      setSelectedLesson(courseData.lessons[nextIndex]);
    }
  };

  const handlePreviousLesson = () => {
    if (!courseData || selectedLessonIndex < 0) return;
    
    const prevIndex = selectedLessonIndex - 1;
    if (prevIndex >= 0) {
      setSelectedLessonIndex(prevIndex);
      setSelectedLesson(courseData.lessons[prevIndex]);
    }
  };

  const handleCompleteLesson = async (lessonId: string, completed: boolean) => {
    // Refresh course details and progress to update completion status
    if (courseData?.isEnrolled) {
      try {
        const progressResponse = await coursesApi.getCourseProgress(courseId);
        if (progressResponse.success && progressResponse.data) {
          // Update course data with latest progress
          setCourseData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              enrollment: {
                ...prev.enrollment!,
                progress: progressResponse.data!.progress,
              },
            };
          });
          
          // Update the selected lesson's completion status if it's the current lesson
          if (selectedLesson && selectedLesson._id === lessonId) {
            setSelectedLesson({
              ...selectedLesson,
              // Note: Lesson type doesn't have isCompleted, but we track it via enrollment
            });
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
        // Fallback to refreshing course details
        await fetchCourseDetails();
      }
    } else {
      // If not enrolled, just refresh course details
      await fetchCourseDetails();
    }
  };

  const handleCloseLessonViewer = () => {
    setSelectedLesson(null);
    setSelectedLessonIndex(-1);
  };

  const handleEnroll = async () => {
    if (isEnrolling) return;

    setIsEnrolling(true);
    try {
      const enrollmentData: { couponCode?: string } = {};
      if (couponCode.trim()) {
        enrollmentData.couponCode = couponCode.trim();
      }

      const response = await coursesApi.enrollInCourse(courseId, enrollmentData);

      if (response.success && response.data) {
        // Check if it's a waitlist response
        if ('waitlistId' in response.data) {
          showSuccess(`Added to waitlist! Your position: ${response.data.position}`);
        } else {
          showSuccess('Successfully enrolled in the course! 🎉');
          // Refresh course details to show enrollment status
          await fetchCourseDetails();
          // Notify parent component if callback provided
          onEnrollmentSuccess?.();
        }
        setCouponCode('');
        setShowCouponInput(false);
      } else {
        showError(response.message || 'Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      showError('An error occurred while enrolling in the course');
    } finally {
      setIsEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton variant="rounded" height={40} width={120} theme="light" className="mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton variant="rectangular" height={400} theme="light" className="rounded-xl mb-6" />
              <Skeleton variant="text" width="70%" height={32} theme="light" className="mb-4" />
              <Skeleton variant="text" width="100%" theme="light" className="mb-2" />
              <Skeleton variant="text" width="90%" theme="light" className="mb-6" />
              <div className="bg-white rounded-xl shadow-md p-6">
                <Skeleton variant="text" width="60%" theme="light" className="mb-4 h-6" />
                <Skeleton variant="text" width="80%" theme="light" className="mb-2" />
                <Skeleton variant="text" width="70%" theme="light" />
              </div>
            </div>
            <div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <Skeleton variant="text" width="50%" theme="light" className="mb-4 h-6" />
                <Skeleton variant="text" width="100%" theme="light" className="mb-2" />
                <Skeleton variant="text" width="80%" theme="light" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-xl mb-2">Course not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { course, enrollment, isEnrolled } = courseData;
  // Use merged sections and lessons with progress data
  const sections = getSectionsWithProgress();
  const lessons = getLessonsWithProgress();
  // Use progress from API if available, otherwise from enrollment
  const progress = progressData?.progress || enrollment?.progress;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header with Back Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Courses</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              {course.thumbnailUrl && (
                <div className="h-64 bg-gradient-to-br from-blue-400 to-blue-600 overflow-hidden">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    course.level === 'beginner' ? 'bg-green-500 text-white' :
                    course.level === 'intermediate' ? 'bg-yellow-500 text-white' :
                    course.level === 'advanced' ? 'bg-red-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {course.level === 'all' ? 'All Levels' : course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                  {course.category && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                      {course.category.name}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-lg text-gray-600 mb-4">{course.shortDescription}</p>
                
                {course.longDescription && (
                  <div className="prose max-w-none mb-6">
                    <p className="text-gray-700 leading-relaxed">{course.longDescription}</p>
                  </div>
                )}

                {/* Course Stats */}
                <div className="flex flex-wrap items-center gap-6 py-4 border-t border-b">
                  <div className="flex items-center gap-2">
                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{course.rating.average.toFixed(1)}</span>
                    <span className="text-gray-500">({course.rating.count} reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={20} className="text-gray-400" />
                    <span className="text-gray-600">{course.lessonsCount} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={20} className="text-gray-400" />
                    <span className="text-gray-600">{formatDuration(course.durationMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={20} className="text-gray-400" />
                    <span className="text-gray-600">{course.tutorId.name}</span>
                  </div>
                </div>

                {/* Tags */}
                {course.tags && course.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Course Sections and Lessons */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Content</h2>
              
              {sections.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sections available</p>
              ) : (
                <div className="space-y-4">
                  {sections.map((section) => (
                    <div key={section._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleSection(section._id)}
                        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            expandedSections.has(section._id) ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {expandedSections.has(section._id) ? '−' : '+'}
                          </div>
                          <div className="text-left flex-1">
                            <h3 className="font-semibold text-gray-900">{section.title}</h3>
                            {section.description && (
                              <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <p className="text-xs text-gray-400">
                                {section.lessons.length} lessons
                                {section.completedLessons > 0 && (
                                  <span className="ml-2 text-green-600 font-semibold">
                                    • {section.completedLessons} completed
                                  </span>
                                )}
                              </p>
                              {section.completionPercentage > 0 && (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 transition-all"
                                      style={{ width: `${section.completionPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500 font-medium">
                                    {section.completionPercentage}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>

                      {expandedSections.has(section._id) && (
                        <div className="px-6 py-4 bg-white border-t">
                          {section.lessons.length === 0 ? (
                            <p className="text-gray-500 text-sm py-4">No lessons in this section</p>
                          ) : (
                            <div className="space-y-3">
                              {section.lessons.map((lesson) => (
                                <div
                                  key={lesson._id}
                                  onClick={() => handleLessonClick(lesson)}
                                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                    isLessonCompleted(lesson._id)
                                      ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div className="mt-1 flex-shrink-0">
                                      {isLessonCompleted(lesson._id) ? (
                                        <CheckCircle size={24} className="text-green-600 fill-green-600" />
                                      ) : lesson.isPreview ? (
                                        <PlayCircle size={24} className="text-blue-600" />
                                      ) : (
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-gray-900">{lesson.title}</h4>
                                        {lesson.isPreview && (
                                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                                            Preview
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>
                                      <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                          <Clock size={14} />
                                          {formatDuration(lesson.durationMinutes)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <FileText size={14} />
                                          {lesson.contentType}
                                        </span>
                                      </div>
                                      
                                      {/* Resources */}
                                      {lesson.resources && lesson.resources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <p className="text-xs font-medium text-gray-700 mb-2">Resources:</p>
                                          <div className="flex flex-wrap gap-2">
                                            {lesson.resources.map((resource) => (
                                              <a
                                                key={resource._id}
                                                href={resource.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded transition-colors"
                                              >
                                                <Download size={12} />
                                                {resource.name}
                                              </a>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Enrollment Card */}
            <div className="bg-white rounded-2xl shadow-md p-6 sticky top-8">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatPrice(course.price, course.currency)}
                </div>
                {isEnrolled ? (
                  <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                    Enrolled
                  </div>
                ) : (
                  <div className="space-y-3">
                    {course.price === 0 ? (
                      <button
                        onClick={handleEnroll}
                        disabled={isEnrolling}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEnrolling ? 'Enrolling...' : 'Enroll for Free'}
                      </button>
                    ) : (
                      <>
                        {!showCouponInput && (
                          <button
                            onClick={() => setShowCouponInput(true)}
                            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          >
                            Enroll Now
                          </button>
                        )}
                        {showCouponInput && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Enter coupon code (optional)"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleEnroll}
                                disabled={isEnrolling}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              >
                                {isEnrolling ? 'Enrolling...' : 'Enroll'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowCouponInput(false);
                                  setCouponCode('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Progress (if enrolled) */}
              {isEnrolled && progress && (
                <div className="border-t pt-6 mt-6">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm font-semibold text-blue-600">{progress.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex justify-between">
                      <span>Lessons Completed</span>
                      <span className="font-semibold">{progress.lessonsCompleted} / {progress.totalLessons}</span>
                    </div>
                    {progress.lastAccessedAt && (
                      <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                        <Calendar size={14} />
                        <span>Last accessed: {new Date(progress.lastAccessedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Course Info */}
              <div className="border-t pt-6 mt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">This course includes:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      {course.lessonsCount} on-demand lessons
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      {formatDuration(course.durationMinutes)} of content
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      Downloadable resources
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-600" />
                      Certificate of completion
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tutor Info */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Instructor</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xl">
                  {course.tutorId.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{course.tutorId.name}</p>
                  {course.tutorId.email && (
                    <p className="text-sm text-gray-500">{course.tutorId.email}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Viewer Modal */}
      {selectedLesson && courseData && (
        <LessonViewer
          lesson={selectedLesson}
          courseId={courseId}
          courseTitle={courseData.course.title}
          sections={courseData.sections}
          allLessons={courseData.lessons}
          currentLessonIndex={selectedLessonIndex}
          isEnrolled={courseData.isEnrolled}
          isCompleted={isLessonCompleted(selectedLesson._id)}
          onClose={handleCloseLessonViewer}
          onNextLesson={handleNextLesson}
          onPreviousLesson={handlePreviousLesson}
          onCompleteLesson={handleCompleteLesson}
        />
      )}
    </div>
  );
}

