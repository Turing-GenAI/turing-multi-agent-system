import React, { useEffect, useRef, useState } from "react";
import MessageList from "./messageList";
import OptionList from "./optionList";

export interface ChatSectionProps {
	chat_id: string;
	useCase: number;
	messages: {
		type: string;
		text: string;
		time: string;
		icon?: boolean;
	}[];
	setDisabled: (param: boolean) => void;
	shouldScroll: boolean;
}

const Messages: React.FC<ChatSectionProps> = React.memo(
	({ useCase, messages, setDisabled, shouldScroll }) => {
		// const messageEndRef = useRef<HTMLDivElement>(null);

		// const [isUserScrolling, setIsUserScrolling] = useState(false);
		// messageEndRef.current?.scrollIntoView({ behavior: "smooth" });

		// useEffect(() => {
		// 	// const isAtBottom =
		// 	// 	messageEndRef?.current?.scrollHeight !== undefined &&
		// 	// 	messageEndRef?.current?.scrollTop !== undefined &&
		// 	// 	messageEndRef?.current?.clientHeight !== undefined &&
		// 	// 	messageEndRef?.current?.scrollHeight -
		// 	// 		messageEndRef?.current?.scrollTop ===
		// 	// 		messageEndRef?.current?.clientHeight;
		// 	// if (isAtBottom) {
		// 	// 	messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
		// 	// }

		// 	let userHasScrolled = false;

		// 	// const handleUserScroll = () => {
		// 	// 	userHasScrolled = true;
		// 	// 	setIsUserScrolling(true);
		// 	// 	window.removeEventListener("scroll", handleScroll);
		// 	// };

		// 	const handleScroll = () => {
		// 		const scrollTop =
		// 			window.pageYOffset || messageEndRef?.current?.scrollTop;
		// 		const scrollHeight = messageEndRef?.current?.scrollHeight;
		// 		const clientHeight = messageEndRef?.current?.clientHeight;
		// 		// Check if user is near the bottom
		// 		if (
		// 			scrollHeight !== undefined &&
		// 			scrollTop !== undefined &&
		// 			clientHeight !== undefined &&
		// 			scrollHeight - scrollTop <= clientHeight + 100
		// 		) {
		// 			setIsUserScrolling(false);
		// 		} else {
		// 			setIsUserScrolling(true);
		// 		}

		// 		// if (!userHasScrolled) {
		// 		// 	userHasScrolled = true;
		// 		// 	// window.removeEventListener("scroll", handleScroll);
		// 		// 	messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
		// 		// }
		// 	};

		// 	handleScroll();
		// 	// window.addEventListener("scroll", handleScroll);
		// 	// window.addEventListener("wheel", handleUserScroll);
		// 	// window.addEventListener("touchmove", handleUserScroll);

		// 	// return () => {
		// 	// 	window.removeEventListener("scroll", handleScroll);
		// 	// 	window.removeEventListener("wheel", handleUserScroll);
		// 	// 	window.removeEventListener("touchmove", handleUserScroll);
		// 	// };

		// 	// const scrollTop =
		// 	// 	window.pageYOffset || document.documentElement.scrollTop;
		// 	// const scrollHeight = document.documentElement.scrollHeight;
		// 	// const clientHeight = document.documentElement.clientHeight;

		// 	// if (scrollHeight - scrollTop <= clientHeight + 100) {
		// 	// 	messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
		// 	// }
		// }, [messages.length, messageEndRef]);

		// useEffect(() => {
		// const scrollToBottom = () => {
		// window.scrollTo(0, document.body.scrollHeight);
		// messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
		// };
		// if (!isUserScrolling) {
		// scrollToBottom();
		// }
		// }, [messages.length, shouldScroll]);

		return (
			<section className="homemain">
				<div className="container">
					<div className="row justify-content-center">
						<div className="col-md-10">
							<div className="chatsection">
								<MessageList messages={messages} setDisabled={setDisabled} />
								{/* <div ref={messageEndRef}></div> */}
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}
);

export default React.memo(Messages);
