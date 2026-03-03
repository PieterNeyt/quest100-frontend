interface ChatMessage {
  type: 'private' | 'group' | 'join';
  senderId: string;
  recipientId?: string; // Used if type is 'private'
  roomId?: string;      // Used if type is 'group'
  content: string;
}
