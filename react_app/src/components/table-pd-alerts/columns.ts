import { ColumnDef } from "@tanstack/react-table";

// export type PDAlertsType = {
// 	subjectId: number;
// 	IHnumber: string;
// 	EDCrecordId: string | number;
// 	PDtermDVterm: string;
// 	PDdescription: string;
// 	additionalInformation: string;
// 	DVDECOD: string;
// 	PDoccuredDate: Date | string;
// 	PDendDate: Date | string;
// 	confirmedCategory: string;
// };

export type PDAlertsType = {
	Subject: number; // Matches "Subject"
	// IHnumber: string; // Not present in the data, consider removing or mapping
	EDCrecordId: string | number; // Not present in the data, consider removing or mapping
	// PDtermDVterm: string; // Not present in the data, consider removing or mapping
	Description: string; // Matches "Description"
	additionalInformation: string; // Matches "Comments"
	Comments: string;
	// DVDECOD: string; // Not present in the data, consider removing or mapping
	// PDoccuredDate: Date | string; // Not present in the data, consider removing or mapping
	PDendDate: Date | string; // Matches "End_Date"
	// confirmedCategory: string; // Not present in the data, consider removing or mapping
	Protocol_Name: string; // Matches "Protocol_Name"
	Country: string; // Matches "Country"
	Site_Name: string; // Matches "Site_Name"
	Principal_Investigator: string; // Matches "Principal_Investigator"
	Category: string; // Matches "Category"
	Severity: string; // Matches "Severity"
	Deviation: string; // Matches "Deviation"
	Action_Taken: string | null; // Matches "Action_Taken"
	Created_Date: Date | number; // Matches "Created_Date"
	Start_Date: Date | number; // Matches "Start_Date"
	End_Date: Date | string | null; // Matches "End_Date"
	Number_Days_Outstanding: number; // Matches "Number_Days_Outstanding"
	Number_Days_to_Become_Aware_of_the_Issue: number; // Matches "Number_Days_to_Become_Aware_of_the_Issue"
	Subject_Visit: string | null; // Matches "Subject_Visit"
	Reason_for_Exclusion_JQPD: string | null; // Matches "Reason_for_Exclusion_JQPD"
	Included_in_JQPD_metric: string | null; // Matches "Included_in_JQPD_metric"
};

export const defaultColumns = [
	{
		accessorKey: "Subject",
		header: () => "Subject ID", // Matches "Subject"
		width: "7%",
	},
	// {
	// 	accessorKey: "IHnumber", // Consider removing or mapping
	// 	header: () => "IH Number",
	// 	width: "10%",
	// },
	// {
	// 	accessorKey: "EDCrecordId", // Consider removing or mapping
	// 	header: "EDC Record ID",
	// 	width: "10%",
	// },
	{
		accessorKey: "Site_Name", // Matches "Site_Name"
		header: () => "Site Name",
		width: "10%",
	},
	{
		accessorKey: "Category", // Matches "Category"
		header: () => "Category",
		width: "10%",
	},
	{
		accessorKey: "Severity", // Matches "Severity"
		header: () => "Severity",
		width: "7%",
	},
	{
		accessorKey: "Description", // Matches "Description"
		header: "PD Description",
		width: "20%",
	},
	{
		accessorKey: "Comments", // Matches "Comments"
		header: "Comments",
		width: "30%",
	},
	{
		accessorKey: "Protocol_Name", // Matches "Protocol_Name"
		header: () => "Protocol Name",
		width: "10%",
	},
	{
		accessorKey: "Country", // Matches "Country"
		header: () => "Country",
		width: "10%",
	},

	{
		accessorKey: "Principal_Investigator", // Matches "Principal_Investigator"
		header: () => "Principal Investigator",
		width: "10%",
	},

	{
		accessorKey: "Deviation", // Matches "Deviation"
		header: () => "Deviation",
		width: "10%",
	},
	{
		accessorKey: "Action_Taken", // Matches "Action_Taken"
		header: () => "Action Taken",
		width: "10%",
	},
	{
		accessorKey: "Created_Date", // Matches "Created_Date"
		header: () => "Created Date",
		width: "10%",
	},
	{
		accessorKey: "Start_Date", // Matches "Start_Date"
		header: () => "Start Date",
		width: "10%",
	},
	{
		accessorKey: "End_Date", // Matches "End_Date"
		header: () => "End Date",
		width: "10%",
	},
	{
		accessorKey: "Number_Days_Outstanding", // Matches "Number_Days_Outstanding"
		header: () => "Days Outstanding",
		width: "10%",
	},
	{
		accessorKey: "Number_Days_to_Become_Aware_of_the_Issue", // Matches "Number_Days_to_Become_Aware_of_the_Issue"
		header: () => "Days to Awareness",
		width: "10%",
	},
	{
		accessorKey: "Subject_Visit", // Matches "Subject_Visit"
		header: () => "Subject Visit",
		width: "10%",
	},
	{
		accessorKey: "Reason_for_Exclusion_JQPD", // Matches "Reason_for_Exclusion_JQPD"
		header: () => "Reason for Exclusion",
		width: "10%",
	},
	{
		accessorKey: "Included_in_JQPD_metric", // Matches "Included_in_JQPD_metric"
		header: () => "Included in JQPD Metric",
		width: "10%",
	},
];

export type AEAlertInfoType = {
	SiteGroupName: string;
	Site: string;
	Subject: number;
	RecordPosition: string | number;
	"What is the adverse event term?": string;
	"Toxicity Grade": string | number;
	"Date of Report": Date | number;
	"Date Investigator/ Investigational Staff became aware": Date | number | null;
	death: string | null;
	"date of death": Date | number | null;
	"admission date": Date | number | null;
	"hospital discharge date": Date | number | null;
	"Required Hospitalization": string | null;
	"is this an infection?": string | null;
	"infection treatment": string | null;
	"Action taken with Amivantamab": string | null;
	"Action taken with Lazertinib": string | null;
	"Action taken with Carboplatin": string | null;
	"Action taken with Pemetrexed": string | null;
	"Relationship to Amivantamab SC-CF": string | null;
	"Relationship to Lazertinib": string | null;
	"Relationship to Carboplatin": string | null;
	"Relationship to Pemetrexed": string | null;
	"AE of special interest as per protocol": string | null;
	page: string | null;
	outcome: string;
	"start date": Date | number | null;
	"start time": Date | number | null;
	"end date": Date | number | string | null;
	"end time": Date | string | number | null;

	"concomitant treatment given for AE": string;
	"Serious AE": string | boolean;
	"Age at onset of SAE": string | number | null;
	// actionTakenAmivantamab: string;
	// actionTakenLazertini: string;
};

export type DelayedAEAlertInfoType = {
	siteGroupName: string;
	site: string;
	subject: string | number;
	recordPosition: string | number;
	adverseEvent: string;
	toxicityGrade: string | number;
	outcome: string;
	dateOfReport: Date | string;
	dateInvestigator: Date | string;
	startDate: Date | string;
	startTime: string;
	endDate: Date | string;
	endTime: string;
	ConcomitantTreatment: string;
	seriousKey: string | boolean;
};

// export const defaultColumns = [
// 	{
// 		accessorKey: "subjectId",
// 		header: () => "Subject ID",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "IHnumber",
// 		header: () => "IH Number",
// 		width: "10%",
// 	},
// 	{
// 		accessorKey: "EDCrecordId",
// 		header: "EDC Record ID",
// 		width: "10%",
// 	},
// 	{
// 		accessorKey: "PDtermDVterm",
// 		header: "PD Term DVTERM",
// 		width: "8%",
// 	},
// 	{
// 		accessorKey: "PDdescription",
// 		header: "PD Description",
// 		width: "20%",
// 	},
// 	{
// 		accessorKey: "additionalInformation",
// 		header: "Additional Information",
// 		width: "20%",
// 	},
// 	{
// 		accessorKey: "DVDECOD",
// 		header: "Janssen Classification DVDECOD",
// 		width: "6%",
// 	},
// 	{
// 		accessorKey: "PDoccuredDate",
// 		header: "PD Occured Date",
// 		width: "10%",
// 	},
// 	{
// 		accessorKey: "PDendDate",
// 		header: "PD End Date",
// 		width: "10%",
// 	},
// 	{
// 		accessorKey: "confirmedCategory",
// 		header: "Confirmed Category",
// 		width: "10%",
// 	},
// ];

export const AEAlertInfo = [
	{
		accessorKey: "SiteGroupName", // Ensure this matches the data key
		header: () => "Site Group Name",
		width: "7%",
	},
	{
		accessorKey: "Site", // Ensure this matches the data key
		header: () => "Site",
		width: "7%",
	},
	{
		accessorKey: "Subject", // Ensure this matches the data key
		header: () => "Subject",
		width: "7%",
	},
	{
		accessorKey: "RecordPosition", // Ensure this matches the data key
		header: () => "Record Position",
		width: "7%",
	},
	{
		accessorKey: "What is the adverse event term?", // Ensure this matches the data key
		header: () => "What is the adverse event term?",
		width: "7%",
	},
	{
		accessorKey: "Toxicity Grade", // Ensure this matches the data key
		header: () => "Toxicity Grade",
		width: "7%",
	},
	{
		accessorKey: "outcome", // Ensure this matches the data key
		header: () => "Outcome",
		width: "7%",
	},
	{
		accessorKey: "start date", // Ensure this matches the data key
		header: () => "Start Date",
		width: "7%",
	},
	{
		accessorKey: "start time", // Ensure this matches the data key
		header: () => "Start Time",
		width: "7%",
	},
	{
		accessorKey: "end date", // Ensure this matches the data key
		header: () => "End Date",
		width: "7%",
	},
	{
		accessorKey: "end time", // Ensure this matches the data key
		header: () => "End Time",
		width: "7%",
	},
	{
		accessorKey: "concomitant treatment given for AE", // Ensure this matches the data key
		header: () => "Concomitant treatment given for AE",
		width: "7%",
	},
	{
		accessorKey: "Serious AE", // Ensure this matches the data key
		header: () => "Serious AE",
		width: "7%",
	},
	{
		accessorKey: "Age at onset of SAE", // Ensure this matches the data key
		header: () => "Age at onset of SAE",
		width: "7%",
	},
	{
		accessorKey: "Action taken with Amivantamab", // Ensure this matches the data key
		header: () => "Action Taken with Amivantamab",
		width: "7%",
	},
	{
		accessorKey: "Action taken with Lazertinib", // Ensure this matches the data key
		header: () => "Action Taken with Lazertinib",
		width: "7%",
	},
	{
		accessorKey: "Action taken with Carboplatin", // Ensure this matches the data key
		header: () => "Action Taken with Carboplatin",
		width: "7%",
	},
	{
		accessorKey: "Action taken with Pemetrexed", // Ensure this matches the data key
		header: () => "Action Taken with Pemetrexed",
		width: "7%",
	},
	{
		accessorKey: "Relationship to Amivantamab SC-CF", // Ensure this matches the data key
		header: () => "Relationship to Amivantamab SC-CF",
		width: "7%",
	},
	{
		accessorKey: "Relationship to Lazertinib", // Ensure this matches the data key
		header: () => "Relationship to Lazertinib",
		width: "7%",
	},
	{
		accessorKey: "Relationship to Carboplatin", // Ensure this matches the data key
		header: () => "Relationship to Carboplatin",
		width: "7%",
	},
	{
		accessorKey: "Relationship to Pemetrexed", // Ensure this matches the data key
		header: () => "Relationship to Pemetrexed",
		width: "7%",
	},
	{
		accessorKey: "AE of special interest as per protocol", // Ensure this matches the data key
		header: () => "AE of special interest as per protocol",
		width: "7%",
	},
	{
		accessorKey: "page", // Ensure this matches the data key
		header: () => "Page",
		width: "7%",
	},
	{
		accessorKey: "date of death", // Ensure this matches the data key
		header: () => "Date of Death",
		width: "7%",
	},
	{
		accessorKey: "admission date", // Ensure this matches the data key
		header: () => "Admission Date",
		width: "7%",
	},
	{
		accessorKey: "hospital discharge date", // Ensure this matches the data key
		header: () => "Hospital Discharge Date",
		width: "7%",
	},
	{
		accessorKey: "Required Hospitalization", // Ensure this matches the data key
		header: () => "Required Hospitalization",
		width: "7%",
	},
	{
		accessorKey: "is this an infection?", // Ensure this matches the data key
		header: () => "Is this an infection?",
		width: "7%",
	},
	{
		accessorKey: "infection treatment", // Ensure this matches the data key
		header: () => "Infection Treatment",
		width: "7%",
	},
];

// export const AEAlertInfo = [
// 	{
// 		accessorKey: "SiteGroupName",
// 		header: () => "Site Group Name",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "Site",
// 		header: () => "Site",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "Subject",
// 		header: () => "Subject",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "RecordPosition",
// 		header: () => "Record Position",
// 		width: "7%",
// 	},

// 	{
// 		accessorKey: "What is the adverse event term?",
// 		header: () => "What is the adverse event terms?",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "Toxicity Grade",
// 		header: () => "Toxicity Grade",
// 		width: "7%",
// 	},

// 	{
// 		accessorKey: "outcome",
// 		header: () => "Outcome",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "startDate",
// 		header: () => "Start date",
// 		width: "7%",
// 	},

// 	{
// 		accessorKey: "startTime",
// 		header: () => "Start time",
// 		width: "7%",
// 	},

// 	{
// 		accessorKey: "endDate",
// 		header: () => "End date",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "endTime",
// 		header: () => "End time",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "concomitantTreatment",
// 		header: () => "Concomitant treatment given for AE",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "seriousAE",
// 		header: () => "Serious AE",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "actionTakenAmivantamab",
// 		header: () => "Action Taken with Amivantamab",
// 		width: "7%",
// 	},
// 	{
// 		accessorKey: "actionTakenLazertini",
// 		header: () => "Action Taken with Lazertini",
// 		width: "7%",
// 	},
// ];

export const DelayedAEAlertInfo = [
	{
		accessorKey: "siteGroupName",
		header: () => "Site Group Name",
		width: "7%",
	},
	{
		accessorKey: "site",
		header: () => "Site",
		width: "7%",
	},
	{
		accessorKey: "subject",
		header: () => "Subject",
		width: "7%",
	},
	{
		accessorKey: "recordPosition",
		header: () => "Record Position",
		width: "7%",
	},
	{
		accessorKey: "adverseEvent",
		header: () => "What is the adverse event term",
		width: "7%",
	},
	{
		accessorKey: "toxicityGrade",
		header: () => "Toxicity Grade",
		width: "7%",
	},
	{
		accessorKey: "outcome",
		header: () => "Outcome",
		width: "7%",
	},
	{
		accessorKey: "dateOfReport",
		header: () => "Date of Report",
		width: "7%",
	},
	{
		accessorKey: "dateInvestigator",
		header: () => "Date Investigator / Investigational Staff became aware",
		width: "7%",
	},
	{
		accessorKey: "startDate",
		header: () => "Start Date",
		width: "7%",
	},
	{
		accessorKey: "startTime",
		header: () => "Start TIme",
		width: "7%",
	},
	{
		accessorKey: "endDate",
		header: () => "End Date",
		width: "7%",
	},
	{
		accessorKey: "endTime",
		header: () => "End Time",
		width: "7%",
	},
	{
		accessorKey: "ConcomitantTreatment",
		header: "Concomitant treatment given for AE",
		width: "7%",
	},
	{
		accessorKey: "seriousKey",
		header: "SeriousKey",
		width: "7%",
	},
];

// export const defaultColumnDef: ColumnDef<PDAlertsType>[] = [];
