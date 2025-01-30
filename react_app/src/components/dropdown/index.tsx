import React, { useState } from "react";
import DatePicker from "react-datepicker";

interface DropdownOption {
	label: string;
	value: string;
	status?: string;
}
interface CustomDropdownProps {
	label: string;
	value: string;
	options: DropdownOption[];
	onChange: (value: string) => void;
	isDatePicker?: boolean;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
	label,
	value,
	options,
	onChange,
	isDatePicker,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [dateRangeA, setDateRangeA] = useState<
		[Date | undefined, Date | undefined]
	>([undefined, undefined]);
	const [dateRangeB, setDateRangeB] = useState<
		[Date | undefined, Date | undefined]
	>([undefined, undefined]);

	const handleDateChangeA = (update: [Date | null, Date | null]) => {
		setDateRangeA([update[0] || undefined, update[1] || undefined]);
		if (update[0]) {
			onChange(
				`${formatDateTime(update[0])} - ${formatDateTime(dateRangeB[0])}`
			);
		}
	};

	const handleDateChangeB = (update: [Date | null, Date | null]) => {
		setDateRangeB([update[0] || undefined, update[1] || undefined]);
		if (update[0]) {
			onChange(
				`${formatDateTime(dateRangeA[0])} - ${formatDateTime(update[0])}`
			);
			setIsOpen(false);
		}
	};

	const formatDateTime = (date: Date | undefined) => {
		return date ? `${formatDate(date)}` : "";
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString(undefined, {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	const handleClear = () => {
		setDateRangeA([undefined, undefined]);
		setDateRangeB([undefined, undefined]);
		onChange("");
	};

	const handleToday = () => {
		const today = new Date();
		setDateRangeA([today, today]);
		setDateRangeB([today, today]);
		onChange(`${formatDateTime(today)} - ${formatDateTime(today)}`);
	};

	return (
		<div className="custom-dropdown">
			<div className="dropdown-header" onClick={() => setIsOpen(!isOpen)}>
				<span>{label}</span>
				<span className="carrot-icon">▼</span>
			</div>
			<div className="selected-option">{value}</div>
			{isOpen && (
				<div
					className="dropdown-options"
					style={{
						borderRadius: "24px",
					}}
				>
					{isDatePicker ? (
						<div className="date-picker-container justify-content-between">
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									textAlign: "left",
									paddingLeft: "10px",
									paddingTop: "10px",
								}}
							>
								<div>
									<span
										style={{
											paddingLeft: "3%",
											fontSize: "14px",
											fontWeight: 400,
											color: "#000000",
										}}
									>
										From Date
									</span>
									<div
										style={{
											border: "1px solid #CACACA",
											borderRadius: "10px",
											padding: "10px",
											marginRight: "0.3em",
											marginLeft: "0.2em",
											boxShadow: "0px 4px 4px 0px #00000040",
										}}
									>
										<DatePicker
											startDate={dateRangeA[0]}
											onChange={(update: Date | null) => {
												handleDateChangeA([update, null]);
												console.log("changing");
											}}
											inline
											dateFormat="MMMM d, yyyy"
											showMonthDropdown
											showYearDropdown
											dropdownMode="select"
										/>
										<div className="date-picker-footer">
											<div className="date-picker-buttons">
												<button type="button" onClick={handleToday}>
													Today
												</button>
												<button type="button" onClick={handleClear}>
													Clear
												</button>
											</div>
										</div>
									</div>
								</div>
								<div>
									<span
										style={{
											paddingLeft: "3%",
											fontSize: "14px",
											fontWeight: 400,
											color: "#000000",
										}}
									>
										To Date
									</span>
									<div
										style={{
											border: "1px solid #CACACA",
											borderRadius: "10px",
											padding: "10px",
											marginRight: "1em",
											marginLeft: "0.3em",
											boxShadow: "0px 4px 4px 0px #00000040",
										}}
									>
										<DatePicker
											startDate={dateRangeB[0]}
											onChange={(update: Date | null) => {
												handleDateChangeB([update, null]);
												console.log("changing B");
											}}
											inline
											dateFormat="MMMM d, yyyy"
											showMonthDropdown
											showYearDropdown
											dropdownMode="select"
										/>
										<div className="date-picker-footer">
											<div className="date-picker-buttons">
												<button type="button" onClick={handleToday}>
													Today
												</button>
												<button type="button" onClick={handleClear}>
													Clear
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					) : (
						<ul style={{ paddingLeft: "0rem" }}>
							{options.map((option) => (
								<li
									key={option.value}
									data-status={option.status}
									onClick={() => {
										onChange(option.value);
										setIsOpen(false);
									}}
									style={{
										listStyleType: "none",
										paddingLeft: "2rem",
										paddingRight: "2rem",
									}}
								>
									{option.label}
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
};

export default CustomDropdown;
