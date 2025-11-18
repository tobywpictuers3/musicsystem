import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudents } from "@/lib/storage";
import { getMessages, addMessage, deleteMessage, getMessagesForAdmin } from "@/lib/messages";
import { Message, Student } from "@/lib/types";
import { toast } from "sonner";
import { Send, Trash2, Reply, Calendar } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";

export default function MessagingTab() {
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(['all']);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [replyToId, setReplyToId] = useState<string | undefined>();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setStudents(getStudents());
    setMessages(getMessages());
  };

  const handleSendMessage = () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('נא למלא נושא ותוכן הודעה');
      return;
    }

    addMessage({
      senderId: 'admin',
      senderName: 'המנהל',
      recipientIds: selectedRecipients,
      subject,
      content,
      expiresAt: expirationDate || undefined,
      inReplyTo: replyToId,
      type: 'general',
    });

    toast.success('ההודעה נשלחה בהצלחה');
    setSubject('');
    setContent('');
    setExpirationDate('');
    setReplyToId(undefined);
    setSelectedRecipients(['all']);
    loadData();
  };

  const handleDeleteMessage = (messageId: string) => {
    deleteMessage(messageId);
    toast.success('ההודעה נמחקה');
    loadData();
  };

  const handleReply = (message: Message) => {
    setReplyToId(message.id);
    setSelectedRecipients([message.senderId]);
    setSubject(`תגובה: ${message.subject}`);
  };

  const sentMessages = messages.filter(m => m.senderId === 'admin');
  const incomingMessages = getMessagesForAdmin();

  return (
    <div className="space-y-6">
      <Tabs defaultValue="compose" dir="rtl">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">הודעה חדשה</TabsTrigger>
          <TabsTrigger value="sent">דואר יוצא</TabsTrigger>
          <TabsTrigger value="inbox">דואר נכנס</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card>
            <CardHeader>
              <CardTitle>שליחת הודעה חדשה</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {replyToId && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">תגובה להודעה</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyToId(undefined);
                      setSubject('');
                      setContent('');
                    }}
                  >
                    ביטול תגובה
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>נמענים</Label>
                <Select
                  value={selectedRecipients[0]}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      setSelectedRecipients(['all']);
                    } else if (value === 'select') {
                      setSelectedRecipients([]);
                    } else {
                      setSelectedRecipients([value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר נמענים" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">כל התלמידות</SelectItem>
                    <SelectItem value="select">תלמידות נבחרות</SelectItem>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">נושא</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="נושא ההודעה"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">תוכן</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="תוכן ההודעה"
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration">תאריך תפוגה (אופציונלי)</Label>
                <div className="flex gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="expiration"
                    type="datetime-local"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={handleSendMessage} className="w-full">
                <Send className="w-4 h-4 mr-2" />
                שלח הודעה
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>הודעות שנשלחו</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sentMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">אין הודעות</p>
                ) : (
                  sentMessages.map(message => (
                    <Card key={message.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{message.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              אל: {message.recipientIds.includes('all') 
                                ? 'כל התלמידות' 
                                : students.find(s => s.id === message.recipientIds[0])
                                  ? `${students.find(s => s.id === message.recipientIds[0])?.firstName} ${students.find(s => s.id === message.recipientIds[0])?.lastName}`
                                  : 'תלמידות נבחרות'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.expiresAt && (
                          <p className="text-xs text-muted-foreground mt-2">
                            תוקף עד: {format(new Date(message.expiresAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox">
          <Card>
            <CardHeader>
              <CardTitle>הודעות נכנסות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incomingMessages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">אין הודעות</p>
                ) : (
                  incomingMessages.map(message => (
                    <Card key={message.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{message.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              מאת: {message.senderName}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReply(message)}
                            >
                              <Reply className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
