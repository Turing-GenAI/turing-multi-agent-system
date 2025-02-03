import React, { useEffect } from "react";

interface AlertProps {
	message: string;
	type:
		| "primary"
		| "secondary"
		| "success"
		| "danger"
		| "warning"
		| "info"
		| "light"
		| "dark";
	show: boolean;
	onClose: () => void;
}

const Alert: React.FC<AlertProps> = ({ message, type, show, onClose }) => {
	useEffect(() => {
		if (show) {
			const timer = setTimeout(() => {
				onClose();
			}, 4000); // Hide after 3 seconds
			return () => clearTimeout(timer);
		}
	}, [show, onClose]);

	if (!show) {
		return null;
	}
	return (
		<div
			className={`alert alert-${type} alert-dismissible fade show`}
			role="alert"
			style={{
				position: "fixed",
				bottom: "20px",
				right: "20px",
				zIndex: 1051, // Ensures the alert is on top of other content
				minWidth: "250px", // Optional: ensures a minimum width for the alert
			}}
		>
			<svg
				className="bi flex-shrink-0 me-2"
				width="24"
				height="24"
				role="img"
				aria-label="Info:"
			>
				<use xlinkHref="#info-fill" />
			</svg>

			{message}
			<button
				type="button"
				className="btn-close"
				aria-label="Close"
				onClick={onClose}
			></button>
		</div>
	);
};

export default Alert;
