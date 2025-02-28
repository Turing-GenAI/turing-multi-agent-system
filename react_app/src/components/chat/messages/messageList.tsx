import React from "react";
import MessageWrap from "./messageWrap";

interface MessageListProps {
  messages: any[];
  // showMessage: boolean;
  // selectUseCase: (value: number) => void;
  setDisabled: (param: boolean) => void;
}

const MessageList: React.FC<MessageListProps> = React.memo(
  ({ messages, setDisabled }) => {
    const messagesWrap = messages.map((msg, index) => (
      <MessageWrap
        key={index}
        msg={msg}
        // showMessage={showMessage}
        // selectUseCase={selectUseCase}
        setDisabled={setDisabled}     />
    ));
    return <>{messagesWrap}</>;
  }
);

export default MessageList;
