import React, { useEffect, useState } from "react";
import FeedbackForm from "../feedback-modal";
import ReactMarkdown from "react-markdown";
import { AEAlertInfo, defaultColumns } from "../table-pd-alerts/columns";
import { PDAlertTable } from "../table-pd-alerts";

interface FindingsProps {
	data: {
		PD: any[];
		AE: any[];
		SGR?: any;
	};
	handleFindingsData: any;
	foundJob: any;
	handleAlert: ({
		message,
		showStatus,
	}: {
		message: string;
		showStatus: boolean;
	}) => void;
}

const Findings: React.FC<FindingsProps> = ({
	data,
	handleFindingsData,
	foundJob,
	handleAlert,
}) => {
	const [openPDAlertIndex, setOpenPDAlertIndex] = useState<number | null>(null);
	const [openAEAlertIndex, setOpenAEAlertIndex] = useState<number | null>(null);
	const [selectedFinding, setSelectedFinding] = useState<string | null>(
		"PD Alerts"
	);

	const [SGRpdf, setSGRpdf] = useState<string>(""); // New state to hold the PDF URL
	const [showPPT, setShowPPT] = useState<boolean>(false);

	const [feedbackId, setFeedbackId] = useState<string>("");
	const [alertLiked, setAlertLiked] = useState<boolean>(true);
	const [isSGR, setIsSGR] = useState<boolean>(false);
	// Add this new state to track when to force re-render
	const [findingsKey, setFindingsKey] = useState<number>(0);

	const fetchPdf = async () => {
		// New function to fetch the PDF
		try {
			const response = await fetch(
				`${process.env.REACT_APP_API_URL}/get_sgr_ppt/${foundJob.job_id}`
			); // Adjust the URL as needed
			if (response.ok) {
				const data = await response.json();
				let base64String = data.pdf_base64;
				setSGRpdf(base64String); // Set the PDF URL
			} else {
				console.error("Failed to fetch PDF:", response.statusText);
			}
		} catch (error) {
			console.error("Error occurred while fetching PDF:", error);
		} finally {
			setShowPPT(true);
		}
	};

	const togglePopup = () => {
		setFeedbackFormVisible(!isFeedbackFormVisible);
	};

	const [isFeedbackFormVisible, setFeedbackFormVisible] =
		useState<boolean>(false);

	// Add this useEffect to trigger re-render when groupedFindings changes
	useEffect(() => {
		setFindingsKey((prev) => prev + 1);
	}, [data]);

	return (
		<div
			className="flex flex-row justify-start align-items-center mt-4 ml-4 px-4"
			key={findingsKey}
		>
			{["PD Alerts", "AE/SAE Alerts", "SGR Alerts"].map((finding) => (
				<button
					key={finding}
					className={`agent-button mx-2 ${
						selectedFinding === finding
							? "agent-button-filled"
							: "agent-button-outlined"
					}`}
					onClick={() => {
						if (finding === "SGR Alerts") {
							fetchPdf();
						}
						setSelectedFinding(finding);
					}}
				>
					{finding}
				</button>
			))}

			{selectedFinding === "PD Alerts" && (
				<>
					{data.PD.map((pdData, index) => (
						<div key={`PD_${index}`}>
							<div
								style={{
									background: "#F9F1CF",
									borderRadius: "12px",
									marginTop: "2%",
									cursor: "pointer",
									textAlign: "left",
									display: "flex",
								}}
								onClick={() =>
									setOpenPDAlertIndex(openPDAlertIndex === index ? null : index)
								}
							>
								<span
									style={{
										marginLeft: "1%",
										// marginTop: "1%",
										fontWeight: 600,
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									{openPDAlertIndex === index ? "-" : "+"}
								</span>

								<h1 className="alertConclusionText px-4 py-2">
									<ReactMarkdown
										children={pdData.conclusion.split(">")[1]}
										components={{
											li: ({ node, ...props }) => (
												<li style={{ marginBottom: "3%" }} {...props} />
											),
											p: ({ node, ...props }) => (
												<p className="card-text nignt" {...props} />
											),
											h3: ({ node, ...props }) => (
												<h3
													style={{
														fontSize: "1.2rem",
														paddingTop: "10px",
													}}
													{...props}
												/>
											),
										}}
									/>
									{/* {pdData.conclusion} */}
									<span>
										<b>Provide Feedback:</b> &nbsp;
										<i
											className={`bi bi-hand-thumbs-up-fill feedbackIcon ${
												pdData.feedback?.table?.feedbackType === "appreciated"
													? "active"
													: ""
											}`}
											onClick={() => {
												setFeedbackId(pdData.id);
												togglePopup();
												setAlertLiked(true);
												setIsSGR(false);
											}}
										></i>
										<i
											className={`bi bi-hand-thumbs-down-fill feedbackIcon ${
												pdData.feedback?.table?.feedbackType === "disliked"
													? "active"
													: ""
											}`}
											onClick={() => {
												togglePopup();
												setFeedbackId(pdData.id);
												setAlertLiked(false);
												setIsSGR(false);
											}}
										></i>
									</span>
								</h1>

								<div>
									<p></p>
								</div>
							</div>
							{openPDAlertIndex === index && (
								<PDAlertTable columns={defaultColumns} data={pdData.table} />
							)}
						</div>
					))}
				</>
			)}

			{selectedFinding === "AE/SAE Alerts" && (
				<>
					{data.AE.map((aeData, index) => (
						<div key={`AE_${index}`}>
							<div
								style={{
									background: "#F9F1CF",
									borderRadius: "12px",
									marginTop: "2%",
									cursor: "pointer",
									textAlign: "left",
									display: "flex",
								}}
								onClick={() =>
									setOpenAEAlertIndex(openAEAlertIndex === index ? null : index)
								} // Toggle the clicked alert
							>
								<span
									style={{
										marginLeft: "1%",
										fontWeight: 600,
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
									}}
								>
									{openAEAlertIndex === index ? "-" : "+"}{" "}
									{/* Show/hide based on the open index */}
								</span>

								<h1
									className="alertConclusionText px-4 py-2"
									style={{ display: "inline-block" }}
								>
									<ReactMarkdown
										// children={pdData.conclusion}
										children={aeData.conclusion.split(">")[1]}
										components={{
											li: ({ node, ...props }) => (
												<li style={{ marginBottom: "3%" }} {...props} />
											),
											p: ({ node, ...props }) => (
												<p className="card-text nignt" {...props} />
											),
											h3: ({ node, ...props }) => (
												<h3
													style={{
														fontSize: "1.2rem",
														paddingTop: "10px",
													}}
													{...props}
												/>
											),
										}}
									/>

									<span>
										<b>Provide Feedback:</b> &nbsp;
										<i
											className={`bi bi-hand-thumbs-up-fill feedbackIcon ${
												aeData.feedback?.table?.feedbackType === "appreciated"
													? "active"
													: ""
											}`}
											onClick={() => {
												setFeedbackId(aeData.id);
												togglePopup();
												setAlertLiked(true);
												setIsSGR(false);
											}}
										></i>
										<i
											className={`bi bi-hand-thumbs-down-fill feedbackIcon ${
												aeData.feedback?.table?.feedbackType === "disliked"
													? "active"
													: ""
											}`}
											onClick={() => {
												togglePopup();
												setFeedbackId(aeData.id);
												setAlertLiked(false);
												setIsSGR(false);
											}}
										></i>
									</span>
								</h1>
							</div>
							{openAEAlertIndex === index && ( // Show the table only if the index matches
								<PDAlertTable columns={AEAlertInfo} data={aeData.table || []} />
							)}
						</div>
					))}
				</>
			)}

			{selectedFinding === "SGR Alerts" && (
				<div className="PDF-viewer">
					{showPPT && (
						<div>
							<br />
							<div
								style={{
									textAlign: "left",
									marginLeft: "8%",
									marginRight: "6%",
								}}
							>
								<span>
									<b>Provide Feedback:</b> &nbsp;
									<i
										className={`bi bi-hand-thumbs-up-fill feedbackIcon ${
											data.SGR?.table?.feedbackType === "appreciated"
												? "active"
												: ""
										}`}
										onClick={() => {
											togglePopup();
											setAlertLiked(true);
											setIsSGR(true);
										}}
									></i>
									<i
										className={`bi bi-hand-thumbs-down-fill feedbackIcon ${
											data.SGR?.table?.feedbackType === "disliked"
												? "active"
												: ""
										}`}
										onClick={() => {
											togglePopup();
											setAlertLiked(false);
											setIsSGR(true);
										}}
									></i>
								</span>
							</div>
							<br />
							{SGRpdf.length > 0 && (
								// Using an Iframe after trying multiple libraries.
								// i.e. pdfjs-dist, pptx-preview, pspdfkit, react-doc-viewer, react-pdf,
								// none of the above worked perfectly fine except pspdfkit which is a paid library.
								<iframe
									src={`data:application/pdf;base64,${SGRpdf}`}
									width="85%"
									height="400"
								/>
							)}
						</div>
					)}
				</div>
			)}

			<FeedbackForm
				// text={feedbackFormText}
				visible={isFeedbackFormVisible}
				onClose={togglePopup}
				handleAlert={handleAlert}
				alertName="feedbackAlert"
				feedbackType={alertLiked ? "appreciated" : "disliked"}
				feedbackId={feedbackId}
				foundJob={foundJob}
				groupedFindings={data}
				setGroupedFindings={handleFindingsData}
				setFindingsKey={setFindingsKey}
				isSGR={isSGR}
			/>
		</div>
	);
};

export default Findings;
