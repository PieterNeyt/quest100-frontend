interface ChatMessage {
  type: 'private' | 'group';
  senderId: string;
  recipientId?: string; // Used if type is 'private'
  roomId?: string;      // Used if type is 'group'
  text: string;
}
