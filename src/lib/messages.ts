import { Message } from './types';

const MESSAGES_KEY = 'music_students_messages';

export const getMessages = (): Message[] => {
  try {
    const data = localStorage.getItem(MESSAGES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
};

export const saveMessages = (messages: Message[]): void => {
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
};

export const addMessage = (message: Omit<Message, 'id' | 'createdAt'>): Message => {
  const messages = getMessages();
  const newMessage: Message = {
    ...message,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  messages.push(newMessage);
  saveMessages(messages);
  return newMessage;
};

export const deleteMessage = (messageId: string): void => {
  const messages = getMessages();
  const updatedMessages = messages.filter(m => m.id !== messageId);
  saveMessages(updatedMessages);
};

export const markMessageAsRead = (messageId: string, studentId: string): void => {
  const messages = getMessages();
  const message = messages.find(m => m.id === messageId);
  if (message) {
    if (!message.isRead) {
      message.isRead = {};
    }
    message.isRead[studentId] = true;
    saveMessages(messages);
  }
};

export const getMessagesForStudent = (studentId: string): Message[] => {
  const messages = getMessages();
  const now = new Date();
  
  return messages.filter(message => {
    // Check if message has expired
    if (message.expiresAt && new Date(message.expiresAt) < now) {
      return false;
    }
    
    // Include messages sent to all students or specifically to this student
    return message.recipientIds.includes('all') || 
           message.recipientIds.includes(studentId);
  });
};

export const getMessagesForAdmin = (): Message[] => {
  const messages = getMessages();
  const now = new Date();
  
  return messages.filter(message => {
    // Check if message has expired
    if (message.expiresAt && new Date(message.expiresAt) < now) {
      return false;
    }
    
    // Include messages sent to admin
    return message.recipientIds.includes('admin');
  });
};

export const getRecentMessages = (studentId: string, hoursLimit: number = 48): Message[] => {
  const messages = getMessagesForStudent(studentId);
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - hoursLimit);
  
  return messages.filter(message => {
    const messageTime = new Date(message.createdAt);
    return messageTime >= cutoffTime && !message.isRead?.[studentId];
  });
};
