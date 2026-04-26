import { useCallback, useState } from 'react';
import type { SerialMessage, SerialMessageSink } from './types';

const DEFAULT_MESSAGE_LIMIT = 500;

export function useSerialMessages(limit: number = DEFAULT_MESSAGE_LIMIT) {
  const [messages, setMessages] = useState<SerialMessage[]>([]);

  const addMessage = useCallback<SerialMessageSink>((type, text) => {
    setMessages((previousMessages) => {
      const nextMessages = [...previousMessages, { type, text, timestamp: Date.now() }];
      if (nextMessages.length <= limit) {
        return nextMessages;
      }
      return nextMessages.slice(nextMessages.length - limit);
    });
  }, [limit]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
}