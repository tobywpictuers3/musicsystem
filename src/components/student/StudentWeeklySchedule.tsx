import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { getLessons, getStudents } from '@/lib/storage';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import SwapRequestForm from './SwapRequestForm';
import { Lesson } from '@/lib/types';

interface StudentWeeklyScheduleProps {
  studentId: string;
}

const StudentWeeklySchedule = ({ studentId }: StudentWeeklyScheduleProps) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [swapFormOpen, setSwapFormOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [personalCode, setPersonalCode] = useState('');
  
  const allLessons = getLessons();
  const lessons = allLessons.filter(lesson => 
    lesson.studentId === studentId && 
    lesson.status !== 'no_show' // Hide no-show lessons from student view
  );
  const students = getStudents();
  const student = students.find(s => s.id === studentId);

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(currentWeek);
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const getLessonsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    return lessons
      .filter(lesson => lesson.date === dateStr)
      .sort((a, b) => {
        // Show future lessons first, then completed
        if (a.date >= today && b.date < today) return -1;
        if (a.date < today && b.date >= today) return 1;
        return a.startTime.localeCompare(b.startTime);
      });
  };

  const handlePrevWeek = () => {
    const prevWeek = new Date(currentWeek);
    prevWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(prevWeek);
  };

  const handleNextWeek = () => {
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(nextWeek);
  };

  const handleLessonDoubleClick = (lesson: Lesson) => {
    // Only allow swapping of future scheduled lessons
    if (lesson.status !== 'scheduled' || lesson.date < new Date().toISOString().split('T')[0]) {
      toast({
        title: 'לא ניתן להחליף',
        description: 'ניתן להחליף רק שיעורים עתידיים מתוכננים',
        variant: 'destructive',
      });
      return;
    }

    setSelectedLesson(lesson);
    setVerificationDialogOpen(true);
  };

  const handleVerifyCode = () => {
    if (!student || !selectedLesson) return;

    if (personalCode.trim() === student.personalCode) {
      setVerificationDialogOpen(false);
      setSwapFormOpen(true);
      setPersonalCode('');
    } else {
      toast({
        title: 'קוד שגוי',
        description: 'הקוד האישי שהוזן אינו תואם',
        variant: 'destructive',
      });
    }
  };

  const handleCloseSwapForm = () => {
    setSwapFormOpen(false);
    setSelectedLesson(null);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      scheduled: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
    } as const;

    const labels = {
      scheduled: 'מתוכנן',
      completed: 'הושלם',
      cancelled: 'בוטל',
    };

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  if (!student) {
    return <div>תלמידה לא נמצאה</div>;
  }

  return (
    <>
      <Card className="card-gradient card-shadow">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            המערכת השבועית שלי
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Week Navigation */}
          <div className="flex justify-between items-center mb-6">
            <Button onClick={handleNextWeek} variant="outline" size="sm">
              שבוע הבא
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
            <h3 className="text-lg font-semibold">
              {weekDates[0].toLocaleDateString('he-IL')} - {weekDates[6].toLocaleDateString('he-IL')}
            </h3>
            <Button onClick={handlePrevWeek} variant="outline" size="sm">
              <ArrowRight className="h-4 w-4" />
              שבוע קודם
            </Button>
          </div>

          {/* Weekly Schedule Table */}
          <div className="space-y-4">
            {weekDates.map((date, index) => {
              const dayLessons = getLessonsForDay(date);
              const today = new Date().toISOString().split('T')[0];
              const dateStr = date.toISOString().split('T')[0];
              const isToday = dateStr === today;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    isToday ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-lg">
                      {dayNames[index]} - {date.toLocaleDateString('he-IL')}
                      {isToday && <span className="mr-2 text-primary">(היום)</span>}
                    </h4>
                  </div>

                  {dayLessons.length > 0 ? (
                    <div className="space-y-2">
                      {dayLessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          onDoubleClick={() => handleLessonDoubleClick(lesson)}
                          className="p-3 bg-muted/50 rounded-lg flex justify-between items-center hover:bg-muted cursor-pointer transition-colors"
                          title="לחיצה כפולה להחלפת שיעור"
                        >
                          <div className="flex items-center gap-4">
                            <span className="font-medium">
                              {lesson.startTime} - {lesson.endTime}
                            </span>
                            {lesson.notes && (
                              <span className="text-sm text-muted-foreground">{lesson.notes}</span>
                            )}
                          </div>
                          {getStatusBadge(lesson.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">אין שיעורים</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Student Info Summary */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>תאריך התחלה:</strong> {new Date(student.startDate).toLocaleDateString('he-IL')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>אימות קוד אישי</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedLesson && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <strong>שיעור נבחר:</strong> {new Date(selectedLesson.date).toLocaleDateString('he-IL')} בשעה {selectedLesson.startTime}
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="personal-code">הזיני את הקוד האישי שלך</Label>
              <Input
                id="personal-code"
                type="text"
                value={personalCode}
                onChange={(e) => setPersonalCode(e.target.value)}
                placeholder="הקוד האישי"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVerifyCode();
                  }
                }}
              />
            </div>
            <Button onClick={handleVerifyCode} className="w-full">
              המשך
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Swap Form at Bottom */}
      {swapFormOpen && selectedLesson && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg max-h-[80vh] overflow-y-auto">
          <div className="container mx-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">בקשת החלפת שיעור</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSwapForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SwapRequestForm
              studentId={studentId}
              preSelectedLesson={selectedLesson}
              onClose={handleCloseSwapForm}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default StudentWeeklySchedule;

