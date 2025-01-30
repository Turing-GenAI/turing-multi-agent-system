import { useEffect, useState } from "react";

interface PopupProps {
	// text: string;
	visible: boolean;
	isSGR: boolean;
	alertName: string;
	feedbackType: string;
	feedbackId: string;
	foundJob: any;
	groupedFindings: any;
	setGroupedFindings: any;
	setFindingsKey: any;
	onClose: () => void;
	handleAlert: ({
		message,
		showStatus,
	}: {
		message: string;
		showStatus: boolean;
	}) => void;
}

const FeedbackForm: React.FC<PopupProps> = ({
	// text,
	visible,
	isSGR,
	onClose,
	handleAlert,
	alertName,
	feedbackType,
	feedbackId,
	foundJob,
	groupedFindings,
	setGroupedFindings,
	setFindingsKey,
}) => {
	const [feedbackText, setFeedbackText] = useState("");
	const [error, setError] = useState(false);

	useEffect(() => {
		// Clear error when user starts typing
		if (feedbackText.length > 0) {
			setError(false);
		}
	}, [feedbackText]);

	const handleSubmit = async () => {
		if (!feedbackText.trim()) {
			setError(true);
			return;
		}

		try {
			const response = await fetch(
				`${process.env.REACT_APP_API_URL}/user_feedback/${foundJob.job_id}/${feedbackId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						alertName,
						feedbackType,
						feedbackMessage: feedbackText,
						isSGR,
					}),
				}
			);

			if (!response.ok) {
				onClose();
				handleAlert({
					message: "Error submitting feedback",
					showStatus: true,
				});
				return;
			}

			// Create a deep copy of the current groupedFindings
			const updatedFindings = JSON.parse(JSON.stringify(groupedFindings));

			if (isSGR) {
				// Update SGR feedback
				updatedFindings.SGR = {
					...updatedFindings.SGR,
					table: {
						feedbackType: feedbackType,
						feedbackMessage: feedbackText,
					},
				};
			} else {
				// Update PD or AE feedback
				const category = feedbackId.includes("PD") ? "PD" : "AE";
				updatedFindings[category] = updatedFindings[category].map((item: any) =>
					item.id === feedbackId
						? {
								...item,
								feedback: {
									table: {
										feedbackType: feedbackType,
										feedbackMessage: feedbackText,
									},
								},
						  }
						: item
				);
			}

			// Update the state with the new findings
			setGroupedFindings(updatedFindings);

			// Force a re-render by updating the key
			setFindingsKey((prev: number) => prev + 1);

			handleAlert({
				message: "Feedback submitted successfully!",
				showStatus: true,
			});
			onClose();
		} catch (err: any) {
			onClose();
			handleAlert({
				message: "Error submitting feedback",
				showStatus: true,
			});
			console.log(err);
		}
	};

	if (!visible) return null;

	return (
		<div className="overlay" onClick={onClose}>
			<div className="feedbackForm" onClick={(e) => e.stopPropagation()}>
				<div className="formBody">
					<p>You {feedbackType} the alert. Kindly provide feedback.</p>
				</div>

				<textarea
					rows={10}
					value={feedbackText}
					onChange={(e) => setFeedbackText(e.target.value)}
					style={{
						boxShadow: error ? "0 0 5px red" : "none",
						border: error ? "1px solid red" : "1px solid #ccc",
					}}
				/>
				{error && (
					<div
						className="text-danger"
						style={{ fontSize: "0.875rem", marginTop: "0.25rem" }}
					>
						No feedback provided
					</div>
				)}
				<div className="formFooter">
					<button className="submit-btn" onClick={onClose}>
						Close
					</button>
					<button className="run-button" onClick={handleSubmit}>
						Submit
					</button>
				</div>
			</div>
		</div>
	);
};

export default FeedbackForm;
