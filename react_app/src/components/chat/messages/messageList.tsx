import React from "react";
import MessageWrap from "./messageWrap";

interface MessageListProps {
	messages: any[];
	// showMessage: boolean;
	// selectUseCase: (value: number) => void;
	setDisabled: (param: boolean) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, setDisabled }) => {
	const messagesWrap = messages.map((msg, index) => (
		<MessageWrap
			key={index + msg.time}
			msg={msg}
			// showMessage={showMessage}
			// selectUseCase={selectUseCase}
			setDisabled={setDisabled}
		/>
	));
	return <>{messagesWrap}</>;
};

export default React.memo(MessageList);
