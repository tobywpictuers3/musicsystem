import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Send, X } from 'lucide-react';
import { getStudents, getLessons, addSwapRequest, updateLesson } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { addMessage } from '@/lib/messages';
import { Lesson } from '@/lib/types';

interface SwapRequestFormProps {
  studentId: string;
  preSelectedLesson?: Lesson;
  onClose?: () => void;
  requireVerification?: boolean;
}

const SwapRequestForm = ({ studentId, preSelectedLesson, onClose, requireVerification = false }: SwapRequestFormProps) => {
  const [selectedDate, setSelectedDate] = useState(preSelectedLesson?.date || '');
  const [targetStudentId, setTargetStudentId] = useState('');
  const [targetLessonDate, setTargetLessonDate] = useState('');
  const [targetLessonTime, setTargetLessonTime] = useState('');
  const [reason, setReason] = useState('');
  const [swapCode, setSwapCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(!requireVerification);
  
  const students = getStudents();
  const currentStudent = students.find(s => s.id === studentId);
  const otherStudents = students.filter(s => s.id !== studentId);
  const lessons = getLessons().filter(l => l.studentId === studentId);
  
  // Get upcoming lessons for the current student
  const today = new Date().toISOString().split('T')[0];
  const upcomingLessons = lessons.filter(l => l.date >= today && l.status === 'scheduled');

  const handleVerifyCode = () => {
    if (!currentStudent) return;
    
    if (verificationCode.trim() === currentStudent.personalCode) {
      setIsVerified(true);
      toast({
        title: 'אומת בהצלחה',
        description: 'כעת ניתן להמשיך בבקשת ההחלפה',
      });
    } else {
      toast({
        title: 'קוד שגוי',
        description: 'הקוד האישי שהוזן אינו תואם',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitRequest = () => {
    if (!isVerified) {
      toast({
        title: 'שגיאה',
        description: 'יש לאמת את הקוד האישי תחילה',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDate || !targetStudentId || !targetLessonDate || !targetLessonTime || !reason.trim()) {
      toast({
        title: 'שגיאה',
        description: 'יש למלא את כל השדות',
        variant: 'destructive',
      });
      return;
    }

    const selectedLesson = upcomingLessons.find(l => l.date === selectedDate);
    if (!selectedLesson) {
      toast({
        title: 'שגיאה',
        description: 'שיעור לא נמצא',
        variant: 'destructive',
      });
      return;
    }

    const allStudents = getStudents();
    const requester = allStudents.find(s => s.id === studentId);
    const targetStudent = allStudents.find(s => s.id === targetStudentId);

    if (!requester || !targetStudent) {
      toast({
        title: 'שגיאה',
        description: 'תלמידה לא נמצאה',
        variant: 'destructive',
      });
      return;
    }

    // Check if swap code was provided and matches target student's swap code
    const targetSwapCode = targetStudent.swapCode || targetStudent.personalCode;
    const isAutoApproved = swapCode.trim() && swapCode.trim() === targetSwapCode;

    if (isAutoApproved) {
      // Perform automatic swap
      const targetLessons = getLessons().filter(l => l.studentId === targetStudentId);
      const targetLesson = targetLessons.find(l => l.date === targetLessonDate && l.startTime === targetLessonTime);

      if (targetLesson) {
        // Swap the lessons
        updateLesson(selectedLesson.id, { studentId: targetStudentId });
        updateLesson(targetLesson.id, { studentId: studentId });

        // Send confirmation message to requester
        addMessage({
          senderId: 'admin',
          senderName: 'המערכת',
          recipientIds: [studentId],
          subject: 'החלפת שיעור אושרה',
          content: `החלפת השיעור בוצעה בהצלחה!\n\nהשיעור שלך מתאריך ${selectedDate} בשעה ${selectedLesson.startTime}\nהוחלף עם השיעור של ${targetStudent.firstName} ${targetStudent.lastName}\nמתאריך ${targetLessonDate} בשעה ${targetLessonTime}`,
          type: 'system',
        });

        // Send confirmation message to target student
        addMessage({
          senderId: 'admin',
          senderName: 'המערכת',
          recipientIds: [targetStudentId],
          subject: 'החלפת שיעור בוצעה',
          content: `השיעור שלך הוחלף!\n\n${requester.firstName} ${requester.lastName} החליפה עם השיעור שלך מתאריך ${targetLessonDate} בשעה ${targetLessonTime}\nבאמצעות השיעור שלה מתאריך ${selectedDate} בשעה ${selectedLesson.startTime}\n\nסיבה: ${reason.trim()}`,
          type: 'system',
        });

        // Send report to admin
        addMessage({
          senderId: 'system',
          senderName: 'המערכת',
          recipientIds: ['admin'],
          subject: 'דיווח על החלפת שיעור אוטומטית',
          content: `החלפת שיעור בוצעה אוטומטית:\n\n${requester.firstName} ${requester.lastName}\nשיעור מקורי: ${selectedDate} בשעה ${selectedLesson.startTime}\n\nהוחלף עם: ${targetStudent.firstName} ${targetStudent.lastName}\nשיעור: ${targetLessonDate} בשעה ${targetLessonTime}\n\nסיבה: ${reason.trim()}`,
          type: 'system',
        });

        toast({
          title: 'ההחלפה בוצעה בהצלחה!',
          description: 'השיעורים הוחלפו והודעות נשלחו לכולן',
        });
      } else {
        toast({
          title: 'שגיאה',
          description: 'השיעור המבוקש להחלפה לא נמצא',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // Send swap request to admin for approval
      addSwapRequest({
        requesterId: studentId,
        targetId: targetStudentId,
        date: selectedDate,
        time: selectedLesson.startTime,
        reason: reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      const messageContent = `בקשת החלפת שיעור חדשה\n\nמבקש: ${requester.firstName} ${requester.lastName}\nשיעור מקורי: ${selectedDate} בשעה ${selectedLesson.startTime}\n\nמבוקש להחליף עם: ${targetStudent.firstName} ${targetStudent.lastName}\nשיעור מבוקש: ${targetLessonDate} בשעה ${targetLessonTime}\n\nסיבה: ${reason.trim()}`;
      
      addMessage({
        senderId: studentId,
        senderName: `${requester.firstName} ${requester.lastName}`,
        recipientIds: ['admin'],
        subject: 'בקשת החלפת שיעור',
        content: messageContent,
        type: 'swap_request',
      });

      toast({
        title: 'הבקשה נשלחה בהצלחה',
        description: 'הבקשה נשלחה למנהלת לאישור',
      });
    }

    // Reset form
    setSelectedDate('');
    setTargetStudentId('');
    setTargetLessonDate('');
    setTargetLessonTime('');
    setReason('');
    setSwapCode('');
    
    if (onClose) {
      onClose();
    }
  };

  const formatLessonOption = (lesson: any) => {
    const date = new Date(lesson.date).toLocaleDateString('he-IL');
    return `${date} - ${lesson.startTime}`;
  };

  const handleTargetLessonDoubleClick = (lesson: Lesson) => {
    setTargetLessonDate(lesson.date);
    setTargetLessonTime(lesson.startTime);
  };

  // Get target student's lessons if a target is selected
  const targetStudentLessons = targetStudentId 
    ? getLessons().filter(l => l.studentId === targetStudentId && l.status === 'scheduled' && l.date >= new Date().toISOString().split('T')[0])
    : [];

  return (
    <Card className="card-gradient card-shadow border-2 border-primary/30">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            בקשת החלפת שיעור חד פעמי
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {requireVerification && !isVerified && (
          <div className="p-4 bg-primary/10 border-2 border-primary/30 rounded-lg space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <Label className="text-base font-semibold">שלב 1: אימות קוד אישי</Label>
            </div>
            {preSelectedLesson && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  <strong>שיעור נבחר:</strong> {new Date(preSelectedLesson.date).toLocaleDateString('he-IL')} בשעה {preSelectedLesson.startTime}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="verification-code">הזיני את הקוד האישי שלך</Label>
              <div className="flex gap-2">
                <Input
                  id="verification-code"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="הקוד האישי"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleVerifyCode();
                    }
                  }}
                />
                <Button onClick={handleVerifyCode} variant="default">
                  אמת
                </Button>
              </div>
            </div>
          </div>
        )}

        {isVerified && (
          <>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                כאן תוכלי לבקש החלפת שיעור חד פעמי עם תלמידה אחרת. 
                לחצי לחיצה כפולה על שיעור במערכת למעלה או בחרי שיעור מהרשימה למטה.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="lesson-date">בחירת שיעור להחלפה</Label>
                <Select value={selectedDate} onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחרי שיעור להחלפה" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingLessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.date}>
                        {formatLessonOption(lesson)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="target-student">עם איזו תלמידה תרצי להחליף?</Label>
                <Select value={targetStudentId} onValueChange={setTargetStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחרי תלמידה" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {targetStudentId && targetStudentLessons.length > 0 && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <Label className="mb-2 block">לחיצה כפולה על השיעור המבוקש להחלפה:</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {targetStudentLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        onDoubleClick={() => handleTargetLessonDoubleClick(lesson)}
                        className="p-2 bg-background rounded border border-border hover:bg-accent cursor-pointer transition-colors"
                      >
                        {formatLessonOption(lesson)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="target-date">תאריך השיעור המבוקש להחלפה</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={targetLessonDate}
                  onChange={(e) => setTargetLessonDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="target-time">שעת השיעור המבוקש להחלפה</Label>
                <Input
                  id="target-time"
                  type="time"
                  value={targetLessonTime}
                  onChange={(e) => setTargetLessonTime(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reason">סיבת החלפה</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="אנא פרטי את הסיבה להחלפה (למשל: אירוע משפחתי, בחינה, וכו')"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="swap-code">קוד החלפה (אופציונלי - לאישור אוטומטי)</Label>
                <Input
                  id="swap-code"
                  type="text"
                  value={swapCode}
                  onChange={(e) => setSwapCode(e.target.value)}
                  placeholder="הזיני את קוד ההחלפה של התלמידה"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  אם תזיני את קוד ההחלפה הנכון, ההחלפה תתבצע אוטומטית ללא אישור מנהל
                </p>
              </div>

              <Button 
                onClick={handleSubmitRequest}
                className="w-full hero-gradient hover:scale-105 transition-musical"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                שליחת בקשה
              </Button>
            </div>

            {upcomingLessons.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                אין שיעורים קרובים זמינים להחלפה
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SwapRequestForm;
