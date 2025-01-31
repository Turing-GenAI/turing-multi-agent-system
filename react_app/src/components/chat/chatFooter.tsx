import React, { useState } from "react";
import "./spinStyles.css";
import "./chat-styles.css";

interface ChatFooterProps {
	// addMessage: (text: string, type: string) => void;
	job_id: string;
	getResponse: (feedback: string, jobId: string) => void;
	disabled: boolean;
	setDisabled: any;
	// getHistory: () => void;
}

const ChatFooter: React.FC<ChatFooterProps> = React.memo(
	({ job_id, getResponse, disabled, setDisabled }) => {
		const [message, setMessage] = useState("");
		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			setMessage(e.target.value);
		};

		const handleSend = () => {
			if (message.trim()) {
				// addMessage(message, "right");
				getResponse(message, job_id);
				setMessage("");
				setDisabled(true);
			}
		};

		const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
			if (e.key === "Enter" && message.length > 0 && !disabled) {
				handleSend();
			}
		};

		return (
			<section className="chatfooter mt-auto">
				<div className="container">
					<div className="row justify-content-center">
						<div className="col-md-10">
							<div className="chat-input-wrapper">
								<input
									type="text"
									className="form-control chatinput"
									placeholder="Type your message"
									value={message}
									onChange={handleInputChange}
									onKeyPress={handleKeyPress}
									disabled={disabled}
								/>
								{/* <button
									className="btn btn-secondary iconround iconmedium send-button"
									onClick={() => handleSend()}
									disabled={disabled || message.length === 0}
									style={{
										position: "fixed",
										left: "69%",
										top: "92%",
									}}
								> */}
								<i
									className={` ${
										disabled
											? "bi bi-arrow-clockwise icon-spin chat-icon-spin"
											: "bi bi-send chat-icon"
									}`}
								></i>
								{/* </button> */}
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}
);

export default ChatFooter;
