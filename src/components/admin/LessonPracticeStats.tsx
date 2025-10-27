import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { getStudentPracticeSessions, getLessons } from '@/lib/storage';
import { Lesson } from '@/lib/types';

interface LessonPracticeStatsProps {
  studentId: string;
  lesson: Lesson;
}

const LessonPracticeStats = ({ studentId, lesson }: LessonPracticeStatsProps) => {
  const [practiceMinutes, setPracticeMinutes] = useState(0);
  const [medals, setMedals] = useState<string[]>([]);

  useEffect(() => {
    const sessions = getStudentPracticeSessions(studentId);
    const studentLessons = getLessons()
      .filter(l => l.studentId === studentId && l.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Find the previous lesson
    const lessonIndex = studentLessons.findIndex(l => l.id === lesson.id);
    if (lessonIndex === -1) {
      setPracticeMinutes(0);
      setMedals([]);
      return;
    }

    const previousLesson = lessonIndex > 0 ? studentLessons[lessonIndex - 1] : null;
    
    // Calculate practice sessions between lessons
    const startDate = previousLesson ? previousLesson.date : '1900-01-01';
    const endDate = lesson.date;

    const relevantSessions = sessions.filter(s => s.date > startDate && s.date <= endDate);
    const totalMinutes = relevantSessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    
    setPracticeMinutes(totalMinutes);

    // Calculate medals for this period
    const allMedals: string[] = [];
    
    // Group by date
    const grouped = relevantSessions.reduce((acc, session) => {
      if (!acc[session.date]) {
        acc[session.date] = [];
      }
      acc[session.date].push(session);
      return acc;
    }, {} as Record<string, typeof sessions>);

    // Check for streaks
    const dates = Object.keys(grouped).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    let prevDate = new Date(0);

    dates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dayDiff = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1 || currentStreak === 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
      prevDate = date;
    });

    if (maxStreak >= 7) allMedals.push('🥇 שבוע רצוף');
    else if (maxStreak >= 6) allMedals.push('🥈 6 ימים');
    else if (maxStreak >= 3) allMedals.push('🥉 ' + maxStreak + ' ימים');

    // Check for daily duration records
    let maxDailyMinutes = 0;
    Object.values(grouped).forEach(daySessions => {
      const dailyTotal = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0);
      maxDailyMinutes = Math.max(maxDailyMinutes, dailyTotal);
    });

    if (maxDailyMinutes >= 60) allMedals.push('🥇 60 דק\'');
    else if (maxDailyMinutes >= 30) allMedals.push('🥈 30 דק\'');
    else if (maxDailyMinutes >= 15) allMedals.push('🥉 15 דק\'');

    setMedals(allMedals);
  }, [studentId, lesson.id]);

  if (practiceMinutes === 0 && medals.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-1">
      {practiceMinutes > 0 && (
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <Trophy className="h-3 w-3" />
          {practiceMinutes} דק'
        </Badge>
      )}
      {medals.map((medal, idx) => (
        <Badge key={idx} variant="secondary" className="text-xs">
          {medal}
        </Badge>
      ))}
    </div>
  );
};

export default LessonPracticeStats;
