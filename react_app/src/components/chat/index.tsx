import React, { useState, useEffect, useRef } from "react";
import "./chat-styles.css";

interface Message {
	id: number;
	text: string;
	sender: "user" | "server";
}

interface ChatData {
	id: number;
	name: string;
	messages: Message[];
}

const ChatComponent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
	const [activeChat, setActiveChat] = useState<number>(1);
	const [chats, setChats] = useState<ChatData[]>([
		{ id: 1, name: "Chat 1", messages: [] },
		{ id: 2, name: "Chat 2", messages: [] },
		{ id: 3, name: "Chat 3", messages: [] },
	]);
	const [inputMessage, setInputMessage] = useState<string>("");
	const messagesEndRef = useRef<null | HTMLDivElement>(null);

	useEffect(() => {
		scrollToBottom();
	}, [chats]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const sendMessage = () => {
		if (inputMessage.trim() === "") return;

		const newMessage: Message = {
			id: Date.now(),
			text: inputMessage,
			sender: "user",
		};

		setChats((prevChats) =>
			prevChats.map((chat) =>
				chat.id === activeChat
					? { ...chat, messages: [...chat.messages, newMessage] }
					: chat
			)
		);

		setInputMessage("");

		// Simulate server response
		setTimeout(() => {
			const serverResponse: Message = {
				id: Date.now(),
				text: `Server response to: ${inputMessage}`,
				sender: "server",
			};

			setChats((prevChats) =>
				prevChats.map((chat) =>
					chat.id === activeChat
						? { ...chat, messages: [...chat.messages, serverResponse] }
						: chat
				)
			);
		}, 1000);
	};

	return (
		<div className="chat-component">
			<div className="chat-header">
				<h2>Chat</h2>
				<button onClick={onClose}>Close</button>
			</div>
			<div className="chat-buttons">
				{chats.map((chat) => (
					<button
						key={chat.id}
						onClick={() => setActiveChat(chat.id)}
						className={activeChat === chat.id ? "active" : ""}
					>
						{chat.name}
					</button>
				))}
			</div>
			<div className="chat-messages">
				{chats
					.find((chat) => chat.id === activeChat)
					?.messages.map((message) => (
						<div key={message.id} className={`message ${message.sender}`}>
							{message.text}
						</div>
					))}
				<div ref={messagesEndRef} />
			</div>
			<div className="chat-input">
				<input
					type="text"
					value={inputMessage}
					onChange={(e) => setInputMessage(e.target.value)}
					onKeyPress={(e) => e.key === "Enter" && sendMessage()}
					placeholder="Type a message..."
				/>
				<button onClick={sendMessage}>Send</button>
			</div>
		</div>
	);
};

export default ChatComponent;
