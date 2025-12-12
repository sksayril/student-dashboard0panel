import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, PlayCircle, FileText, Download, CheckCircle, Clock, BookOpen, X } from 'lucide-react';
import { Lesson, CourseSection } from '../api/types';
import { coursesApi } from '../api';
import { useToast } from './ToastContainer';

interface LessonViewerProps {
  lesson: Lesson;
  courseId: string;
  courseTitle: string;
  sections: CourseSection[];
  allLessons: Lesson[];
  currentLessonIndex: number;
  isEnrolled: boolean;
  isCompleted: boolean;
  onClose: () => void;
  onNextLesson?: () => void;
  onPreviousLesson?: () => void;
  onCompleteLesson?: (lessonId: string, completed: boolean) => void;
}

export default function LessonViewer({
  lesson,
  courseId,
  courseTitle,
  sections,
  allLessons,
  currentLessonIndex,
  isEnrolled,
  isCompleted,
  onClose,
  onNextLesson,
  onPreviousLesson,
  onCompleteLesson,
}: LessonViewerProps) {
  const { showSuccess, showError } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getNextLesson = (): Lesson | null => {
    if (currentLessonIndex < allLessons.length - 1) {
      return allLessons[currentLessonIndex + 1];
    }
    return null;
  };

  const getPreviousLesson = (): Lesson | null => {
    if (currentLessonIndex > 0) {
      return allLessons[currentLessonIndex - 1];
    }
    return null;
  };

  const handleCompleteLesson = async () => {
    if (isCompleted || !isEnrolled) return;

    setIsCompleting(true);
    try {
      // Update lesson progress via API
      const response = await coursesApi.updateLessonProgress(courseId, {
        lessonId: lesson._id,
        completed: true,
      });

      if (response.success && response.data) {
        const message = response.data.lesson.isCompleted 
          ? 'Lesson marked as completed! ✅' 
          : 'Lesson marked as incomplete';
        showSuccess(message);
        // Call the completion callback to refresh parent component
        if (onCompleteLesson) {
          onCompleteLesson(lesson._id, response.data.lesson.isCompleted);
        }
      } else {
        showError(response.message || 'Failed to mark lesson as completed');
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      showError('An error occurred while marking lesson as completed');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleNextStep = () => {
    const nextLesson = getNextLesson();
    if (nextLesson && onNextLesson) {
      onNextLesson();
    } else {
      showError('No more lessons available');
    }
  };

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{courseTitle}</h2>
              <p className="text-blue-100 text-sm mt-1">{lesson.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {previousLesson && onPreviousLesson && (
              <button
                onClick={onPreviousLesson}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Previous
              </button>
            )}
            {nextLesson && onNextLesson && (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-blue-600 rounded-lg transition-colors font-semibold flex items-center gap-2"
              >
                Next
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            {/* Lesson Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                {isCompleted ? (
                  <CheckCircle size={32} className="text-green-600" />
                ) : (
                  <PlayCircle size={32} className="text-blue-600" />
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{lesson.title}</h1>
                  <div className="flex items-center gap-4 mt-2 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock size={16} />
                      {formatDuration(lesson.durationMinutes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={16} />
                      {lesson.contentType}
                    </span>
                    {lesson.isPreview && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded font-semibold">
                        Preview
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-lg text-gray-700 leading-relaxed">{lesson.description}</p>
            </div>

            {/* Lesson Content */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lesson Content</h3>
              <div className="bg-gray-100 rounded-xl overflow-hidden">
                {lesson.contentType === 'video' && lesson.contentUrl ? (
                  <div className="aspect-video">
                    <video
                      src={lesson.contentUrl}
                      controls
                      className="w-full h-full"
                      onEnded={() => {
                        // Auto-complete lesson when video ends (if enrolled)
                        if (isEnrolled && !isCompleted) {
                          handleCompleteLesson();
                        }
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : lesson.contentType === 'text' ? (
                  <div className="p-8 prose max-w-none">
                    <p className="text-gray-700 leading-relaxed">
                      {lesson.contentUrl ? (
                        <iframe
                          src={lesson.contentUrl}
                          className="w-full h-96 border-0"
                          title={lesson.title}
                        />
                      ) : (
                        <div className="text-center py-20 text-gray-500">
                          <BookOpen size={64} className="mx-auto mb-4 opacity-50" />
                          <p>Text content will be displayed here</p>
                        </div>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <FileText size={64} className="mx-auto mb-4 opacity-50" />
                    <p>Content type: {lesson.contentType}</p>
                    {lesson.contentUrl && (
                      <a
                        href={lesson.contentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Open Content
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Resources Section */}
            {lesson.resources && lesson.resources.length > 0 && (
              <div className="mb-8 border-t pt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Download size={24} />
                  Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lesson.resources.map((resource) => (
                    <a
                      key={resource._id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
                    >
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Download size={24} className="text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {resource.name}
                        </h4>
                        <p className="text-sm text-gray-500 capitalize">{resource.type} file</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Completion and Navigation */}
            <div className="border-t pt-8 flex items-center justify-between">
              <div>
                {isEnrolled && (
                  <button
                    onClick={handleCompleteLesson}
                    disabled={isCompleted || isCompleting}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                      isCompleted
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle size={20} />
                        Completed
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        {isCompleting ? 'Marking...' : 'Mark as Complete'}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Next Step Button */}
              {nextLesson && (
                <button
                  onClick={handleNextStep}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2 shadow-lg"
                >
                  Next Step
                  <ArrowRight size={20} />
                </button>
              )}
              {!nextLesson && (
                <div className="px-6 py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold">
                  Course Complete! 🎉
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

