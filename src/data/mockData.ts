import { StudentData } from '../types/student';

export const studentData: StudentData = {
  name: 'James',
  avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
  score: 87,
  weeklyHours: 3.5,
  semesterHours: 125,
  skillImprovement: 12,
  mainSkillpoints: 74,
  teammates: [
    {
      id: '1',
      name: 'Anna Ballard',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100',
      score: 87,
    },
    {
      id: '2',
      name: 'Melissa Reebika',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
      score: 76,
    },
    {
      id: '3',
      name: 'Sam Vadkina',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
      score: 64,
    },
  ],
  nextLessons: [
    {
      id: '1',
      title: 'Advanced Creative Technique',
      category: 'Graphic design, Photoshop',
      duration: '35:12 m',
      color: 'bg-purple-500',
    },
    {
      id: '2',
      title: 'Customer Journey Mapping',
      category: 'UX / UI, Architecture',
      duration: '22:43 m',
      color: 'bg-orange-400',
    },
    {
      id: '3',
      title: 'Building Remote Teams',
      category: 'Management, Jira',
      duration: '1:35 h',
      color: 'bg-lime-400',
    },
    {
      id: '4',
      title: 'Figma Workshop',
      category: 'Professional Tools',
      duration: '1:12 h',
      color: 'bg-pink-400',
    },
  ],
  skills: [
    { name: 'Graphic Design', percentage: 35, color: 'text-blue-500' },
    { name: 'UX / UI', percentage: 30, color: 'text-orange-400' },
    { name: 'Management', percentage: 35, color: 'text-lime-400' },
  ],
};
