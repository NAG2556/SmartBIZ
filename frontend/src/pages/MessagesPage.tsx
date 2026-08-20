import React from 'react';
import { MessageLogsList } from '../components/messaging/MessageLogsList';

export const MessagesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <MessageLogsList />
    </div>
  );
};
