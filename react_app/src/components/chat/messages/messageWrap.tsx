import React, { useEffect, useState } from "react";
import moment from "moment";
import { useTypewriter } from "react-simple-typewriter";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

export interface MessageWrapProps {
	msg: any;
	icon?: boolean;
	setDisabled: (param: boolean) => void;
}

const TypewriterEffect: React.FC<{
	message: any;
	setDisabled: (param: boolean) => void;
}> = ({ message, setDisabled }) => {
	const [isUserScrolling, setIsUserScrolling] = useState(false);

	const [texting, helper] = useTypewriter({
		words: [message.text],
		loop: 1,
		typeSpeed: 9,
	});

	useEffect(() => {
		if (helper.isDone && message.text.length > 0) {
			setDisabled(false);
		} else if (helper.isType) {
			setDisabled(true);
		}
	}, [helper]);

	useEffect(() => {
		let userHasScrolled = false;

		const handleUserScroll = () => {
			userHasScrolled = true;
			setIsUserScrolling(true);
			window.removeEventListener("scroll", handleScroll);
		};

		const handleScroll = () => {
			const scrollTop =
				window.pageYOffset || document.documentElement.scrollTop;
			const scrollHeight = document.documentElement.scrollHeight;
			const clientHeight = document.documentElement.clientHeight;

			// Check if user is near the bottom
			if (scrollHeight - scrollTop <= clientHeight + 100) {
				setIsUserScrolling(false);
			} else {
				setIsUserScrolling(true);
			}

			if (!userHasScrolled) {
				userHasScrolled = true;
				window.removeEventListener("scroll", handleScroll);
			}
		};

		window.addEventListener("scroll", handleScroll);
		window.addEventListener("wheel", handleUserScroll);
		window.addEventListener("touchmove", handleUserScroll);

		return () => {
			window.removeEventListener("scroll", handleScroll);
			window.removeEventListener("wheel", handleUserScroll);
			window.removeEventListener("touchmove", handleUserScroll);
		};
	}, []);

	useEffect(() => {
		const scrollToBottom = () => {
			window.scrollTo(0, document.body.scrollHeight);
		};
		if (!isUserScrolling) {
			scrollToBottom();
		}
	}, [texting, isUserScrolling]);

	return (
		// <ReactMarkdown children={message?.typewriter ? texting : message.text} />
		<ReactMarkdown
			remarkPlugins={[remarkBreaks]}
			children={texting.replace(/\t/gi, "&nbsp; &nbsp; &nbsp;")}
			components={{
				li: ({ node, ...props }) => (
					<li style={{ marginBottom: "3%" }} {...props} />
				),
				p: ({ node, ...props }) => <p className="card-text nignt" {...props} />,
			}}
		/>
	);
};
const MessageWrap: React.FC<MessageWrapProps> = React.memo(
	({ msg, setDisabled }) => {
		const listStyles = {
			marginBottom: "5%",
		};
		// const containsSpecialCharacters = (text: string) => /[\n\t]/.test(text);
		const formattedTime = moment(msg.time, "h:mm:ss A").format("h:mm A");
		useEffect(() => {
			if (msg.text.length == 0) {
				setDisabled(true);
			}
		});

		// const [isUserScrolling, setIsUserScrolling] = useState(false);

		// useEffect(() => {
		// 	let userHasScrolled = false;

		// 	const handleUserScroll = () => {
		// 		userHasScrolled = true;
		// 		setIsUserScrolling(true);
		// 		window.removeEventListener("scroll", handleScroll);
		// 	};

		// 	const handleScroll = () => {
		// 		const scrollTop =
		// 			window.pageYOffset || document.documentElement.scrollTop;
		// 		const scrollHeight = document.documentElement.scrollHeight;
		// 		const clientHeight = document.documentElement.clientHeight;

		// 		// Check if user is near the bottom
		// 		if (scrollHeight - scrollTop <= clientHeight + 100) {
		// 			setIsUserScrolling(false);
		// 		} else {
		// 			setIsUserScrolling(true);
		// 		}

		// 		if (!userHasScrolled) {
		// 			userHasScrolled = true;
		// 			window.removeEventListener("scroll", handleScroll);
		// 		}
		// 	};

		// 	window.addEventListener("scroll", handleScroll);
		// 	window.addEventListener("wheel", handleUserScroll);
		// 	window.addEventListener("touchmove", handleUserScroll);

		// 	return () => {
		// 		window.removeEventListener("scroll", handleScroll);
		// 		window.removeEventListener("wheel", handleUserScroll);
		// 		window.removeEventListener("touchmove", handleUserScroll);
		// 	};
		// }, []);

		// useEffect(() => {
		// 	const scrollToBottom = () => {
		// 		window.scrollTo(0, document.body.scrollHeight);
		// 	};
		// 	if (!isUserScrolling) {
		// 		scrollToBottom();
		// 	}
		// }, [isUserScrolling]);

		return (
			<div className={`message-wrap ${msg.type}`}>
				<div className="d-flex flex-row">
					{/* {
            msg.type == 'left' && <i className="bi bi-chat-dots blinking-icon mt-3 mx-3" ></i>
          } */}
					{msg.type == "left" && (
						<div
							className="mx-3 text-center pt-2 mt-2"
							style={{
								borderRadius: "50%",
								background: "#D9D9D980",
								width: "50px", // Fixed width
								height: "50px",
								flexShrink: 0,
							}}
						>
							{" "}
							<img src="./robo.png" width={47.23} height={27.29} />{" "}
						</div>
					)}

					<div className="card" style={{ textAlign: "left" }}>
						<div className="card-body">
							<div className="d-flex msg-user-info">
								{/* {containsSpecialCharacters(msg.text) ? ( */}
								{msg?.typewriter ? (
									<div className="card-text nignt">
										{/* {msg.text.length > 0 && (
                      <i className="bi bi-chat-dots pe-2"></i>
                    )} */}
										{/* {msg?.typewriter ? ( */}
										<TypewriterEffect message={msg} setDisabled={setDisabled} />
										{/* ) : (
                      <ReactMarkdown children={msg.text} />
                    )} */}
									</div>
								) : (
									<p className="card-text nignt">
										{msg.icon ||
											(msg.text.length == 0 && (
												<i className="bi bi-chat-dots pe-2 blinking-icon"></i>
											))}

										<ReactMarkdown
											remarkPlugins={[remarkBreaks]}
											children={
												(msg.text = msg.text.replace(
													/\t/gi,
													"&nbsp; &nbsp; &nbsp;"
												))
											}
											components={{
												li: ({ node, ...props }) => (
													<li style={{ marginBottom: "3%" }} {...props} />
												),
												p: ({ node, ...props }) => (
													<p className="card-text nignt" {...props} />
												),
											}}
										/>
									</p>
								)}
							</div>
						</div>
					</div>
					{/* <small className="text-muted datetime">{formattedTime}</small> */}
				</div>
			</div>
		);
	}
);

export default React.memo(MessageWrap);
