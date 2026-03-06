interface SendMessage {
  type: 'private' | 'group' | 'join';
  senderId: string;
  recipientId?: string; // Used if type is 'private'
  roomId?: string;      // Used if type is 'group'
  content: string;
}

interface ReceiveMessage {
  id: string;
  senderId: string;
  message: string;
}
