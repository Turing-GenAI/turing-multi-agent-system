import React, { useCallback, useEffect, useState } from "react";
import "./agent-settings.css";
import Messages from "../components/chat/messages";
import ChatFooter from "../components/chat/chatFooter";
import NavBar from "../components/navbar";

import "react-datepicker/dist/react-datepicker.css";

import Alert from "../components/alerts/alert";
import CustomDropdown from "../components/dropdown";
import Findings from "../components/findings";

interface messagesType {
	type: string;
	text: string;
	time: string;
	icon: boolean;
	typewriter?: boolean;
}
const AgentSettingsPopup: React.FC = () => {
	const [trial, setTrial] = useState<string>("CNTO1275PUC3001");
	const [siteId, setSiteId] = useState<string>("");
	const [allJobs, setAllJobs] = useState<any[]>([]);
	const [foundJob, setJob] = useState<any>({});
	const [date, setDate] = useState<string>("CHOOSE DATE");
	const [showChat, setShowChat] = useState(false);
	const [disabled, setDisabled] = useState<boolean>(false);
	const [runDisabled, setRunDisabled] = useState<boolean>(false);
	const [footerDisabled, setFooterDisabled] = useState<boolean>(true);
	const [selectedTab, setSelectedTab] = useState<number>(0);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [selectedAgent, setSelectedAgent] = useState<string | null>(
		"Trial master"
	);

	const [messages, setMessages] = useState<messagesType[]>([]);
	// const [shouldScroll, setShouldScroll] = useState(true);

	const [trialMasterMessages, setTrialMasterMessages] = useState<
		messagesType[]
	>([]);
	const [inspectionMasterMessages, setInspectionMasterMessages] = useState<
		messagesType[]
	>([]);
	const [CRMMasterMessages, setCRMMasterMessages] = useState<messagesType[]>(
		[]
	);

	const [humanFeedback, setHumanFeedback] = useState<boolean>(false);
	const [groupedFindings, setGroupedFindings] = useState<{
		PD: any[];
		AE: any[];
		SGR?: any;
	}>({ PD: [], AE: [] });

	const [alertMessage, setAlertMessage] = useState<string>("");
	const [showAlertBar, setShowAlertBar] = useState<boolean>(false);
	const [alertType, setAlertType] = useState<
		| "primary"
		| "secondary"
		| "success"
		| "danger"
		| "warning"
		| "info"
		| "light"
		| "dark"
	>("info");

	const renderDropdown = (
		label: string,
		value: string,
		options: {
			label: string;
			value: string;
			status?: string;
		}[],
		onChange: (value: string) => void,
		isDatePicker: boolean = false
	) => (
		<CustomDropdown
			label={label}
			value={value}
			options={options}
			onChange={onChange}
			isDatePicker={isDatePicker}
		/>
	);

	const addMessage = useCallback((text: string, type: string) => {
		setMessages((prevMessages: any) => [
			...prevMessages,
			{
				type: type,
				text,
				time: new Date().toLocaleTimeString(),
				icon: false,
			},
		]);
	}, []);

	const handleAgentSelect = (agent: string) => {
		setSelectedAgent(agent);
		// setShouldScroll(true); // Trigger

		if (agent === "Trial master") {
			updateMessages(trialMasterMessages);
		} else if (agent == "Inspection master") {
			setMessages([]);
			updateMessages(inspectionMasterMessages);
		} else if (agent == "CRM master") {
			updateMessages(CRMMasterMessages);
		}
		// else {
		// 	fetchPdf();
		// }
	};

	const send_human_feedback = async (feedback: string, job_id: string) => {
		// addMessage(feedback, "right");
		setMessages((prevMessages: any) => [
			...prevMessages,
			{
				type: "right",
				text: feedback,
				time: new Date().toLocaleTimeString(),
				icon: false,
			},
		]);
		setInspectionMasterMessages((prevMessages: any) => [
			...prevMessages,
			{
				type: "right",
				text: feedback,
				time: new Date().toLocaleTimeString(),
				icon: false,
			},
		]);
		try {
			const response = await fetch(
				`${process.env.REACT_APP_API_URL}/update-job/${job_id}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						status: "got_human_feedback",
						feedback: feedback,
					}),
				}
			);
			if (response.ok) {
				setHumanFeedback(!humanFeedback);
				setJob((prevJob: any) => ({
					...prevJob, // Spread the previous job object
					status: "got_human_feedback", // Update the specific key
				}));
			}
		} catch (error: any) {
			console.log("error: ", error);
		}
	};

	const fetch_ai_messages = async (jobId: string, withFindings: boolean) => {
		try {
			const url = `${
				process.env.REACT_APP_API_URL
			}/get_ai_messages/${encodeURIComponent(jobId)}`;
			const response = await fetch(url, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					ai_messages: true,
					findings: withFindings,
				}),
			});

			if (response.ok) {
				const data = await response.json();
				console.log("ai messages: ", data);

				if (data.ai_messages == "Agent is processing!") {
					let dataMessage = [
						{
							type: "left",
							text: data.ai_messages,
							time: new Date().toLocaleTimeString(),
							icon: false,
						},
					];
					setCRMMasterMessages(dataMessage);
					setTrialMasterMessages(dataMessage);
					setInspectionMasterMessages(dataMessage);
					if (
						messages.length === 0 || // Check if there are no messages
						messages[messages.length - 1].text !== data.ai_messages // Check if the last message is different
					) {
						if (selectedAgent === "Trial master") {
							addMessage(data?.ai_messages, "left");
						} else if (selectedAgent == "Inspection master") {
							addMessage(data?.ai_messages, "left");
						} else {
							addMessage(data?.ai_messages, "left");
						}
					}
				} else {
					const splitted_messages = data.ai_messages.split(
						"================================== Ai Message =================================="
					);

					let inspectionMasterMessagesArr: {
						type: string;
						text: string; // Corrected property name from 'messageNode' to 'text'
						time: string;
						icon: boolean;
					}[] = [];
					let trialMasterMessagesArr: {
						type: string;
						text: string; // Corrected property name from 'messageNode' to 'text'
						time: string;
						icon: boolean;
					}[] = [];
					let CRMMasterMessagesArr: {
						type: string;
						text: string; // Corrected property name from 'messageNode' to 'text'
						time: string;
						icon: boolean;
					}[] = [];

					// sanitize ai messages:
					splitted_messages.forEach((message: string) => {
						console.log(message, "message", messages);
						// only add if last and current message not same....!
						if (message.length > 0) {
							// if there is some fresh message....
							if (message.includes("Name:")) {
								let messageNode = message.split("Name: ")[1];
								console.log(messageNode.slice(0, 10), "messageNode");
								if (
									messageNode.slice(0, 10).includes("inspection") ||
									messageNode.slice(0, 10).includes("SelfRAG") ||
									messageNode.includes("self_rag_agent")
								) {
									const regex = new RegExp(
										"User input -> Human Feedback:",
										"gi"
									);
									const lines = messageNode.split("\n");
									const matches = lines
										.filter((line) => regex.test(line))
										.join("\n"); // Lines that match
									const nonMatches = lines
										.filter((line) => !regex.test(line))
										.join("\n"); // Lines that do NOT match

									if (matches.length > 0) {
										inspectionMasterMessagesArr.push({
											type: "left",
											text: nonMatches, // Corrected property name from 'messageNode' to 'text'
											time: new Date().toLocaleTimeString(),
											icon: false,
										});
										inspectionMasterMessagesArr.push({
											type: "right",
											text: matches.split(":")[1], // Corrected property name from 'messageNode' to 'text'
											time: new Date().toLocaleTimeString(),
											icon: false,
										});
									} else {
										inspectionMasterMessagesArr.push({
											type: "left",
											text: messageNode.slice(0, 10).includes("inspection")
												? messageNode.split(messageNode.slice(0, 12))[1]
												: messageNode, // Corrected property name from 'messageNode' to 'text'
											time: new Date().toLocaleTimeString(),
											icon: false,
										});
									}
								} else if (messageNode.slice(0, 10).includes("trial")) {
									trialMasterMessagesArr.push({
										type: "left",
										text: messageNode.startsWith("trial supervisor - ")
											? messageNode.replace("trial supervisor - ", "").trim()
											: messageNode,
										time: new Date().toLocaleTimeString(),
										icon: false,
									});
								} else {
									CRMMasterMessagesArr.push({
										type: "left",
										text: messageNode.startsWith("CRM - ")
											? messageNode.replace("CRM - ", "").trim()
											: messageNode,
										time: new Date().toLocaleTimeString(),
										icon: false,
									});
								}
							} else {
								addMessage(message, "left");
							}
							// addMessage(message, "left");
							// }
							// }
						}
					});

					setCRMMasterMessages(CRMMasterMessagesArr);
					setTrialMasterMessages(trialMasterMessagesArr);
					setInspectionMasterMessages(inspectionMasterMessagesArr);

					if (selectedAgent === "Trial master") {
						setMessages(trialMasterMessagesArr);
					} else if (selectedAgent == "Inspection master") {
						setMessages(inspectionMasterMessagesArr);
					} else {
						setMessages(CRMMasterMessagesArr);
					}

					if (withFindings) {
						// set PD and AE/SAE table data...

						setGroupedFindings(
							Object.keys(data.findings).reduce(
								(
									acc: {
										PD: any[];
										AE: any[];
										SGR?: any[];
									},
									key
								) => {
									if (key.includes("PD") && !key.includes("feedback")) {
										// Find corresponding feedback key
										const feedbackKey = Object.keys(data.findings).find(
											(k) => k.includes("feedback") && k.includes(key)
										);

										acc.PD.push({
											...data.findings[key],
											id: key,
											feedback: feedbackKey ? data.findings[feedbackKey] : null,
										});
									} else if (
										key.includes("AE_SAE") &&
										!key.includes("feedback")
									) {
										// Find corresponding feedback key
										const feedbackKey = Object.keys(data.findings).find(
											(k) => k.includes("feedback") && k.includes(key)
										);
										acc.AE.push({
											...data.findings[key],
											id: key,
											feedback: feedbackKey ? data.findings[feedbackKey] : null,
										});
									} else if (key === "SGR_feedback") {
										// Add SGR feedback if present
										acc.SGR = data.findings[key];
									}
									return acc;
								},
								{ PD: [], AE: [] }
							)
						);
					}
				}
			}
		} catch (error: any) {
			console.log("error happened: ", error);
		}
	};

	const getJob = async (siteID: string) => {
		try {
			const response = await fetch(`${process.env.REACT_APP_API_URL}/jobs/`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.ok) {
				const data = await response.json();
				setAllJobs(data?.jobs);
				console.log("Scheduled Jobs.", data);

				let fetchedJobs = data?.jobs.filter(
					(job: { site_id: string }) => job.site_id === siteID
				);
				// Sort jobs by the 'run_at' field to get the most recent job
				fetchedJobs.sort(
					(a: { run_at: string }, b: { run_at: string }) =>
						new Date(b.run_at).getTime() - new Date(a.run_at).getTime()
				);

				let fetchedJob = fetchedJobs[0];
				if (fetchedJob) {
					// update only if the status has changed...!
					// check if a job was already set in state...

					if (
						Object.keys(foundJob).length === 0 || // foundJob is empty
						foundJob.site_id !== siteID || // siteId doesn't match
						fetchedJob.site_id == siteID ||
						foundJob.status !== fetchedJob.status // status has updated
					) {
						// setShowChat(true);
						// setIsLoading(true);
						setJob(fetchedJob);
						setRunDisabled(true);
					}
				} else {
					const blocked_statuses = [
						"processing",
						"queued",
						"take_human_feedback",
						"got_human_feedback",
					];

					const existingJob = data?.jobs.find(
						(job: { site_id: string; status: string }) =>
							blocked_statuses.includes(job.status)
					);
					setRunDisabled(existingJob ? true : false);
					setShowChat(false);
				}
			} else {
				console.log("some error occured getting jobs: ", response);
			}
		} catch (err: any) {
			console.log("err", err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleRun = async () => {
		if (!runDisabled) {
			if (siteId == "" || siteId == "CHOOSE SITE") return;
			setIsLoading(true); // show loading UI...
			setCRMMasterMessages([]);
			setTrialMasterMessages([]);
			setInspectionMasterMessages([]);
			setMessages([]);
			setGroupedFindings({ PD: [], AE: [] });

			try {
				const response = await fetch(
					`${process.env.REACT_APP_API_URL}/schedule-job/`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							site_id: siteId,
							trial_id: trial,
							date: date,
						}),
					}
				);

				if (response.ok) {
					setShowChat(true); // Show chat div on successful response
					setIsLoading(false);
					getJob(siteId);
				} else {
					const errorData = await response.json();
					// handleAlert({
					// 	message: "Failed: " + errorData.detail || "Failed to schedule job",
					// 	showStatus: true,
					// });
					setAlertMessage(
						"Failed: " + errorData.detail || "Failed to schedule job"
					);
					setAlertType("danger");
					setShowAlertBar(true);
					setIsLoading(false);
					console.error("Failed to schedule job:", response.statusText);
				}
			} catch (error) {
				console.error("Error occurred while scheduling job:", error);
				setShowChat(true);
			}
		}
	};

	const handleAlert = async ({
		message,
		showStatus,
		type,
	}: {
		message: string;
		showStatus: boolean;
		type?:
			| "primary"
			| "secondary"
			| "success"
			| "danger"
			| "warning"
			| "info"
			| "light"
			| "dark";
	}) => {
		setAlertMessage(message);
		setAlertType(type || "info");
		setShowAlertBar(showStatus);
	};

	// Inside your component
	const updateMessages = useCallback((newMessages: messagesType[]) => {
		const uniqueMessages: messagesType[] = [];
		const seenMessages = new Set<string>();
		if (newMessages.length !== messages.length) {
			for (const newMsg of newMessages) {
				const normalizedText = newMsg.text.replace(/\n/g, " "); // Replace line breaks with spaces
				const messageSignature = `${normalizedText}-${newMsg.time}-${newMsg.type}`;
				if (!seenMessages.has(messageSignature)) {
					uniqueMessages.push(newMsg);
					seenMessages.add(messageSignature);
				}
			}

			console.log(messages, "existing messages");
			console.log(uniqueMessages, "unique messages....!");

			if (uniqueMessages.length > 0) {
				setMessages((prevMessages: messagesType[]) => [
					...prevMessages,
					...uniqueMessages,
				]);
			}
		}
	}, []); // Dependency on current messages

	// Reset shouldScroll when messages are updated
	// useEffect(() => {
	// 	setShouldScroll(false);
	// }, [messages]);

	useEffect(() => {
		setSiteId("CHOOSE SITE"); // Reset siteId when trial changes
		setJob({});
	}, [trial]); // Dependency on trial

	useEffect(() => {
		setSelectedTab(0);
		setMessages([]);
		getJob(siteId);
		// setShouldScroll(true);
	}, [siteId]);

	useEffect(() => {
		const getMessages = async (withFindings: boolean) => {
			setIsLoading(true);
			await fetch_ai_messages(foundJob?.job_id, withFindings);
		};

		if (Object.keys(foundJob).length > 0 && foundJob.status !== "queued") {
			setIsLoading(false);
			setShowChat(true);

			// if (foundJob.status !== "completed") {
			// 	getMessages(false); // get ai messages without findings table data...
			// } else {
			getMessages(true); // get ai messages with findings table data...
			// }

			setIsLoading(false);

			if (foundJob?.status == "take_human_feedback") {
				setAlertMessage(`Job ${siteId}: requires Human Feedback`);
				setAlertType("warning");
				setShowAlertBar(true);
				setFooterDisabled(false);
				if (selectedAgent !== "Inspection master") {
					handleAgentSelect("Inspection master");
				}

				// setMessages(inspectionMasterMessages);
			} else if (foundJob?.status == "completed") {
				setAlertMessage(`Job ${siteId}: Processing has Completed`);
				setAlertType("success");
				setShowAlertBar(true);
				setFooterDisabled(true); // disable the footer state and later remove it from DOM.
				// Define the blocked statuses
				const blocked_statuses = [
					"processing",
					"queued",
					"take_human_feedback",
					"got_human_feedback",
				];

				// Check if there are any jobs not in a blocked state
				const hasActiveJobs = allJobs.some((job) =>
					blocked_statuses.includes(job.status)
				);

				console.log(hasActiveJobs, "haha job");
				// Set runDisabled to false only if there are no active jobs..
				// Setting false will allow to re-schedule for same siteID.
				setRunDisabled(hasActiveJobs);
			} else if (foundJob?.status == "error") {
				setAlertMessage(
					`Job ${siteId} failed: Internal Server Error, Check Logs...!`
				);
				setAlertType("danger");
				setShowAlertBar(true);
				setFooterDisabled(true);
			} else {
				setFooterDisabled(true);
			}
		} else {
			if (foundJob.status == "queued") {
				// setAlertMessage(`Job ${siteId}: Queued`);
				// setShowAlertBar(true);
				getMessages(false);
				setShowChat(true);
				setIsLoading(false);
			}
		}

		// periodically, check job status and update relevant state if necessary...!
		const regularIntervalId = setInterval(() => {
			if (
				Object.keys(foundJob).length > 0 &&
				foundJob.status !== "completed" &&
				// foundJob.status !== "take_human_feedback" &&
				foundJob.status !== "error"
			) {
				getJob(siteId); // Use the ref here
			}
		}, 2000); // 8000 ms = 8 seconds

		// check status after 33 seconds if status is take human feedback.
		// const feedbackIntervalId = setInterval(() => {
		// 	if (
		// 		Object.keys(foundJob).length > 0 &&
		// 		foundJob.status === "take_human_feedback"
		// 	) {
		// 		getJob(siteId);
		// 	}
		// }, 8000);

		// Cleanup function to clear the intervals on component unmount
		return () => {
			clearInterval(regularIntervalId);
			// clearInterval(feedbackIntervalId);
		};
	}, [foundJob]);

	const trialXSiteIDs = {
		CNTO1275PUC3001: ["P73-PL10007", "P73-PL10008", "U4-JP1002", "U4-JP1003"],
		RIVAROXHFA3001: ["AR00091"],
		"90014496LYM1001": ["BV7-US10007"],
	};

	return (
		<div className="popup">
			<NavBar
				selectUseCase={() => {
					console.log("hahaha");
				}}
				useCase={1}
			/>

			<div className="popup-container">
				{renderDropdown(
					"Trial",
					trial,
					Object.keys(trialXSiteIDs).map((key: any) => ({
						label: key,
						value: key,
					})),
					setTrial
				)}
				{renderDropdown(
					"Site ID",
					siteId,
					trialXSiteIDs[trial as keyof typeof trialXSiteIDs]?.map((site) => {
						// Find job for this site from allJobs state
						const siteJob = allJobs.find(
							(job: { site_id: string }) => job.site_id === site
						);

						let status = "";
						if (siteJob) {
							if (siteJob.status === "completed") {
								status = "completed";
							} else if (siteJob.status === "error") {
								status = "error";
							} else if (siteJob.status === "take_human_feedback") {
								status = "feedback";
							} else if (siteJob.status === "processing") {
								status = "processing";
							}
						}

						return {
							label: site,
							value: site,
							status: status,
						};
					}) || [],
					setSiteId
				)}
				{renderDropdown("Date", date, [], setDate, true)}
				<button
					className="run-button"
					onClick={handleRun}
					disabled={runDisabled}
				>
					RUN
				</button>
			</div>

			{isLoading && <div className="spinner"></div>}
			{showChat && (
				<div className="chat">
					{/* Tabs */}
					<div>
						<ul className="nav nav-pills nav-fill">
							<li
								className="nav-item"
								onClick={() => {
									setSelectedTab(0);
								}}
							>
								<a
									className={`nav-link ${selectedTab === 0 && "active"}`}
									aria-current="page"
									href="#"
								>
									Agents
								</a>
							</li>
							<li
								className="nav-item"
								onClick={() => {
									// if (foundJob.status === "completed") {
									setSelectedTab(1);
									// }
								}}
							>
								<a
									className={`nav-link ${selectedTab === 1 && "active"}`}
									href="#"
								>
									Findings
								</a>
							</li>
						</ul>
					</div>

					{/* Agent Buttons and Chat UI */}
					{selectedTab === 0 && (
						<>
							<div className="flex flex-row justify-start align-items-center mt-4 ml-4">
								{["Trial master", "Inspection master", "CRM master"].map(
									(agent) => (
										<button
											key={agent}
											className={`agent-button mx-2 ${
												selectedAgent === agent
													? "agent-button-filled"
													: "agent-button-outlined"
											}`}
											onClick={() => handleAgentSelect(agent)}
										>
											{agent}
										</button>
									)
								)}
							</div>

							{/* Chatting Container */}
							<div className="chat-container">
								<div className="messages-wrapper">
									<Messages
										messages={messages}
										chat_id={"1"}
										setDisabled={(param: boolean) => setDisabled(param)}
										useCase={0}
										shouldScroll={false}
									/>
								</div>

								{/* Chat Input / Send Message Container */}
								{foundJob.status !== "completed" &&
									foundJob.status !== "error" && (
										<ChatFooter
											getResponse={send_human_feedback}
											job_id={foundJob?.job_id}
											disabled={footerDisabled}
											setDisabled={setFooterDisabled}
										/>
									)}
								{(foundJob.status === "completed" ||
									foundJob.status === "error") && (
									<div className="container align-right">
										<div className="row justify-content-center">
											<div className="col-md-10"></div>
										</div>
									</div>
								)}
							</div>
						</>
					)}

					{/* Findings Tab */}
					{selectedTab == 1 && (
						<Findings
							data={groupedFindings}
							handleFindingsData={setGroupedFindings}
							foundJob={foundJob}
							handleAlert={handleAlert}
						/>
					)}

					{/* Alert Bar end here */}
					<Alert
						message={alertMessage}
						type={alertType || "info"}
						show={showAlertBar}
						onClose={() => setShowAlertBar(false)}
					/>
				</div>
			)}
		</div>
	);
};

export default React.memo(AgentSettingsPopup);
