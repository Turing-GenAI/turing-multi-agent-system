import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CircleDot, Database } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import ReactMarkdown from 'react-markdown';
import { DataViewer } from '../tools/DataViewer';
import { formatSelfRagData } from '../../utils/dataFormatters';

interface AEFinding {
  SiteGroupName: string;
  Site: string;
  Subject: number;
  RecordPosition: number;
  "What is the adverse event term?": string;
  "Toxicity Grade": number;
  outcome: string;
  "Date of Report": number;
  "Date Investigator/ Investigational Staff became aware": number | null;
  "start date": number;
  "start time": number | null;
  "end date": number | null;
  "end time": number | null;
  "concomitant treatment given for AE": string;
  "Serious AE": string;
  "Age at onset of SAE": number | null;
  "death": string | null;
  "date of death": number | null;
  "admission date": number | null;
  "hospital discharge date": number | null;
  "Required Hospitalization": string | null;
  "is this an infection?": string;
  "infection treatment": string | null;
  "Action taken with Amivantamab": string;
  "Action taken with Lazertinib": string;
  "Action taken with Carboplatin": string;
  "Action taken with Pemetrexed": string;
  "Relationship to Amivantamab SC-CF": string;
  "Relationship to Lazertinib": string;
  "Relationship to Carboplatin": string;
  "Relationship to Pemetrexed": string;
  "AE of special interest as per protocol": string;
  page: string;
}

interface PDFinding {
  SiteGroupName: string;
  Site: string;
  Subject: number;
  RecordPosition: number;
  "Deviation Category": string;
  "Deviation Type": string;
  Description: string;
  "Start Date": number;
  "End Date": number;
  "Impact on Subject Safety": string;
  "Impact on Study Data": string;
  "Corrective Action": string;
  "Preventive Action": string;
}

interface FindingsData {
  discrepancy_data_activity_id_AE_SAE_001?: {
    conclusion: string;
    table: AEFinding[];
  };
  discrepancy_data_activity_id_PD_001?: {
    conclusion: string;
    table: PDFinding[];
  };
}

interface FindingsSummaryProps {
  findings?: {
    findings?: FindingsData;
  };
}

export const FindingsSummary: React.FC<FindingsSummaryProps> = ({
  findings = {},
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [selectedContent, setSelectedContent] = useState<{conclusion?: string; table?: any[]; type?: 'pd' | 'ae'}>({});
  const [showDataViewer, setShowDataViewer] = useState(false);
  const [activeDataType, setActiveDataType] = useState<'protocol' | 'guidelines'>('protocol');

  const findingsData = findings?.findings || {} as FindingsData;

  // Count findings
  const aeFindings = findingsData.discrepancy_data_activity_id_AE_SAE_001?.table?.length || 0;
  const pdFindings = findingsData.discrepancy_data_activity_id_PD_001?.table?.length || 0;

  const handleFindingsClick = (type: 'pd' | 'ae') => {
    if (type === 'ae') {
      setDialogTitle('Adverse Event Findings');
      setSelectedContent({
        conclusion: findingsData.discrepancy_data_activity_id_AE_SAE_001?.conclusion,
        table: findingsData.discrepancy_data_activity_id_AE_SAE_001?.table,
        type: 'ae'
      });
    } else {
      setDialogTitle('Protocol Deviation Findings');
      setSelectedContent({
        conclusion: findingsData.discrepancy_data_activity_id_PD_001?.conclusion,
        table: findingsData.discrepancy_data_activity_id_PD_001?.table,
        type: 'pd'
      });
    }
    setDialogOpen(true);
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  const renderTable = () => {
    if (!selectedContent.table || selectedContent.table.length === 0) return null;

    if (selectedContent.type === 'ae') {
      return (
        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Site</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Event Term</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Outcome</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Start Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">End Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Treatment Given</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Serious</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Action (Amivantamab)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedContent.table.map((row: any, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.Subject}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.Site}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["What is the adverse event term?"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["Toxicity Grade"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.outcome}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(row["start date"])}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{formatDate(row["end date"]) || 'Not Available'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["concomitant treatment given for AE"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["Serious AE"]}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{row["Action taken with Amivantamab"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Protocol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Site</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deviation</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Days Outstanding</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {selectedContent.table.map((row: any, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Subject}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Protocol_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Site_Name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Category}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Severity}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="max-w-xs overflow-hidden text-ellipsis">{row.Deviation}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <div className="max-w-md overflow-hidden text-ellipsis">{row.Description}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{row.Number_Days_Outstanding}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Protocol deviation data for the data viewer
  const protocolDeviationData = {
    source: '../outputs//intermediate/processed_files/P73-PL10007_CNTO1275PUC3001/PD/data/filtered_sample_data_AVA/protocol_deviation.xlsx',
    file_directory: '../outputs//intermediate/processed_files/P73-PL10007_CNTO1275PUC3001/PD/data/filtered_sample_data_AVA',
    filename: 'protocol_deviation.xlsx',
    last_modified: '2025-02-28T17:53:23',
    page_name: 'protocol_deviation',
    page_number: 1,
    text_as_html: `<table border="1" class="dataframe">
  <tbody>
    <tr>
      <td>Protocol_Name</td>
      <td>Country</td>
      <td>Site_Name</td>
      <td>Principal_Investigator</td>
      <td>Category</td>
      <td>Severity</td>
      <td>Deviation</td>
      <td>Action_Taken</td>
      <td>Description</td>
      <td>Comments</td>
      <td>Subject</td>
      <td>Start_Date</td>
      <td>End_Date</td>
      <td>Number_Days_Outstanding</td>
      <td>Number_Days_to_Become_Aware_of_the_Issue</td>
      <td>Created_Date</td>
      <td>Subject_Visit</td>
      <td>Reason_for_Exclusion_JQPD</td>
      <td>Included_in_JQPD_metric</td>
    </tr>
    <tr>
      <td>CNTO1275PUC3001</td>
      <td>Poland</td>
      <td>P73-PL10007</td>
      <td>MEGLICKA, Monika</td>
      <td>Other</td>
      <td>Minor</td>
      <td>Blood or urine sample were collected in error, however not destroyed.</td>
      <td>LTM - Iwona Malarowska-Janik, MVR 21Oct2022, Reviewed on 7Nov2022: Per the Central Team guidance PD should be reported as Minor if patient weights more than 25kg. Please confirm patient\'s weight, if &gt;25kg PD should be downgraded to minor and closed.  SM, KG 7NOV22: Subject\'s weight was 58 kg. According to the Central Team decision PD is locked and closed.</td>
      <td>Blood for SM04/serum biomarkers were taken by the subject on screening and on I-0. PI was trained by the SM regarding SM04 requirements. TL has been signed.</td>
      <td>AK 13Sep2022: The guidelines for sites are not really clear. Sites will be re-trained. It\'s a minor issue. But it will need to be discussed with the study team.    LTM - Iwona Malarowska-Janik, MVR 31Aug2022, Reviewed on 16Sep2022: As confirmed by Central Team PD should be considered Minor. As site was retrained PD can be closed and locked.    AK 15Sep2022: The guidelines will be updated. Site issue, not a PD, as per PDIE meeting. SM to inactivate this PD.</td>
      <td>100072</td>
      <td>2022-08-29 00:00:00</td>
      <td>2022-08-29 00:00:00</td>
      <td>0</td>
      <td>4</td>
      <td>2022-09-02 00:00:00</td>
      <td>Week I-0</td>
      <td>Minor PDs or PDs Without Priority</td>
      <td>No</td>
    </tr>
    <tr>
      <td>CNTO1275PUC3001</td>
      <td>Poland</td>
      <td>P73-PL10007</td>
      <td>MEGLICKA, Monika</td>
      <td>Minor PD - Study Procedures</td>
      <td>Minor</td>
      <td>Other</td>
      <td>LTM - Marta Jakubczak, MVR 18-19-Jan-2023, reviewed on 25-Jan-2023  LTM - Marta Jakubczak, MVR 8-9-Mar-2023, reviewed on 15-Mar-2023</td>
      <td>platelets were not analyzed (Platelet clumps present) by the Central Laboratory (Labcorp). Subject was asked to come to the clinic for the retest but subject\'s mother with the subject did not agree on the retest. Subject performed local hematology test on 7 NOV 22. platelets were analyzed and no abnormalities were found (assessed local lab report is available in SD).</td>
      <td>LTM, Marta Jakubczak, 25-Jan-2023: Please try to write minor PDs with accordance to Description Writing Guidance for Deviations and Issues, it should go this way: Missed Assessment, &lt;Visit id&gt;, &lt;Specify which assessments weren\'t done&gt;, &lt;Reason why - if known by the site&gt;. Please close and lock PD once done.  SM, Karolina Grabowska, 25-Jan-2023: Missed Assessment, M24, platelets were not analyzed (Platelet clumps present) by the Central Laboratory (Labcorp). Subject was asked to come to the clinic for the retest but subject\'s mother with the subject did not agree on the retest. Subject performed local hematology test on 7 NOV 22. platelets were analyzed and no abnormalities were found (assessed local lab report is available in SD).    LTM, Marta Jakubczak, 15-Mar-2023: Please close and lock PD.</td>
      <td>100054</td>
      <td>2022-11-28 00:00:00</td>
      <td>2022-11-28 00:00:00</td>
      <td>0</td>
      <td>53</td>
      <td>2023-01-20 00:00:00</td>
      <td>Week M-24</td>
      <td>Minor PDs or PDs Without Priority</td>
      <td>No</td>
    </tr>
    <tr>
      <td>CNTO1275PUC3001</td>
      <td>Poland</td>
      <td>P73-PL10007</td>
      <td>MEGLICKA, Monika</td>
      <td>Minor PD - Study Procedures</td>
      <td>Minor</td>
      <td>Other</td>
      <td>LTM - Marta Jakubczak, MVR 17-18-May-2023, reviewed on 24-May-2023</td>
      <td>Blood oversampling, Week I-0, Due to the site staff mistake</td>
      <td>SM, M.Juchimiuk, 24-May-2023: The sample for serum biomarkers analysis was taken during screening and at I-0, whereas it should be taken only at one of these timepoints. The SM discussed it with PI during the MV 17-18May2023, trained her on the sampling requirements per protocol\'s schedule of assessment and asked to train the site personnel responsible for the oversampling. The site should also inform the patient about this issue and document it in source.    LTM, Marta Jakubczak, 24-May-2023: In a Sponsor Response, any clarification must be prefixed with your data, such as: SM, Mateusz Juchimiuk, 17-May-2023. Please close and lock PD once done.  SM, M.Juchimiuk, 01-Jun-2023: Data added, deviation closed and locked.</td>
      <td>100099</td>
      <td>2023-03-13 00:00:00</td>
      <td>2023-03-13 00:00:00</td>
      <td>0</td>
      <td>72</td>
      <td>2023-05-24 00:00:00</td>
      <td>Week I-0</td>
      <td>Minor PDs or PDs Without Priority</td>
      <td>No</td>
    </tr>
    <tr>
      <td>CNTO1275PUC3001</td>
      <td>Poland</td>
      <td>P73-PL10007</td>
      <td>MEGLICKA, Monika</td>
      <td>Other</td>
      <td>Minor</td>
      <td>Blood or urine sample were collected in error, however not destroyed.</td>
      <td>LTM PZ reviewed.  LTM PZ re-reviewed, status updated and PD closed acording to DMCRO.</td>
      <td>Serum biomarkers sample at I-0 was collected in error however not destroyed</td>
      <td>Sunny Li, DMCRO per PDIE meeting 21Nov2023, this is a Minor PD and can be closed once severity is updated.    SM, M. Juchimiuk, 06Nov2023: The serum biomarkers sample was collected at screening and unnecessarily at I-0. The SN responsible for oversampling at I-0 was not present at site when the deviation was identified by the SM, so SM discussed the finding with the PI. The SM asked PI to re-train the nurse on the blood samples collection schedule. The nurse was trained by PI on 06-Nov-2023, which is documented on training log (a copy was provided to SM via email).  LTM PZ reviewed.</td>
      <td>100142</td>
      <td>2023-09-25 00:00:00</td>
      <td>2023-09-25 00:00:00</td>
      <td>0</td>
      <td>42</td>
      <td>2023-11-06 00:00:00</td>
      <td>Week I-0</td>
      <td>Minor PDs or PDs Without Priority</td>
      <td>No</td>
    </tr>
    <tr>
      <td>CNTO1275PUC3001</td>
      <td>Poland</td>
      <td>P73-PL10007</td>
      <td>MEGLICKA, Monika</td>
      <td>Minor PD - Study Procedures</td>
      <td>Minor</td>
      <td>Other</td>
      <td>LTM - Marta Jakubczak, MVR 5-6-Jul-2023, reviewed on 18-Jul-2023</td>
      <td>Missed assessment, Week M-44, MAYO score not calculated in Yprime due to not sufficient number of eligible patient diaries</td>
      <td>SM, M.Juchimiuk, 13Jul2023: As clarified with the Yprime team - there was not sufficient number of eligible diaries for the system to calculate MAYO score. It was the last patient\'s visit in the study, thus no patient\'s re-training was possible. The SM sent an email to investigators on 13Jul2023 reminding that they should check if at least 3 eligible MAYO diaries were completed within 7 days prior to the visit. If there is less than 3, the visit should be re-scheduled.    LTM, Marta Jakubczak, 18-Jul-2023: Please close and lock PD.    SM, M.Juchimiuk, 07Aug2023: PD closed and locked.</td>
      <td>100062</td>
      <td>2023-06-26 00:00:00</td>
      <td>2023-06-26 00:00:00</td>
      <td>0</td>
      <td>17</td>
      <td>2023-07-13 00:00:00</td>
      <td>Week M-44</td>
      <td>Minor PDs or PDs Without Priority</td>
      <td>No</td>
    </tr>
  </tbody>
</table>`,
    languages: ['eng'],
    filetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    category: 'Table',
    element_id: 'fe90dd85f3e25a8ee30e68b0e12cd8ab'
  };

  // Guidelines data for the data viewer (new format)
  const guidelinesData = {
    source: './documents/PD/guidelines/Inspection Readiness Guidance V4.0.pdf',
    file_directory: './documents/PD/guidelines',
    filename: 'Inspection Readiness Guidance V4.0.pdf',
    last_modified: '2025-02-28T18:05:22',
    page_name: 'Inspection Readiness Guidance',
    page_number: 43,
    text_as_html: `<div class="formatted-text">
      <strong>Inspection Readiness Guidance v4.0:</strong><br>
      <br>
      Page 44 of 66<br>
      <br>
      These instances may create potential findings during Inspections. The Detailed Report section of the
      EAT report can aid in identifying these. However, the Overall % metrics don't account for these
      scenarios.<br>
      <strong>Resources:</strong><br>
      • EAT Report Quick Reference Guide<br>
      • EAT Definition File<br>
      <br>
      <strong>3.2.2 AQR Compliance:</strong><br>
      <br>
      To confirm that V-TMF review is completed for each Functional Area, at protocol-, country-, and site
      level, an Annual Quality Review (AQR) Confirmation Form (TV-eFRM-02260) and evidence of the
      review must be filed in V-TMF. To keep track of which AQR Confirmation Forms have been filed and
      which ones are still pending, the AQR Compliance Report can be used. This report will help to quickly
      identify any compliance risks/issues with regards to TMF Annual Quality Review for a study.<br>
      Note: the threshold for AQR compliance changed from 70% to 80%, effective as of 18Mar2022.<br>
      <strong>Resources:</strong><br>
      • To decide whether AQR is required based on site status in CTMS<br>
      • V-TMF Job Aid in Blackbird<br>
      • AQR Compliance Report Quick Reference Card<br>
      • Video: How to use/interpret the AQR Compliance report in VIPER- Last and Passed views<br>
      • Video: How to use/interpret the AQR Compliance report in VIPER - future views<br>
      <br>
      <strong>3.2.3 Timely Filing:</strong><br>
      <br>
      With inspectors being able to request access to V-TMF, and as we need to be always inspection ready,
      it is important that study documents are filed in V-TMF timely.<br>
      The Timely Filing dashboard allows you to see the study's performance. It can help identify which
      Functional Areas or countries need to improve on their filing timelines. It is very common for Inspectors
      to request timely filing reports to assess whether documents are being filed in a timely manner or
      being uploaded only upon Inspection Notification.<br>
      Timely filing follows the industry standard of 30 calendar days to ensure documents are available in
      the final repository (V-TMF). Please note that only certain document classifications are in scope for the
    </div>`,
    languages: ['eng'],
    filetype: 'application/pdf',
    category: 'Document',
    element_id: 'guidelines_context_dict',
    pages: [
      { page: 36, source: './documents/PD/guidelines/Inspection Readiness Guidance V4.0.pdf' },
      { page: 37, source: './documents/PD/guidelines/Inspection Readiness Guidance V4.0.pdf' },
      { page: 43, source: './documents/PD/guidelines/Inspection Readiness Guidance V4.0.pdf' }
    ]
  };

  // Format the data for the DataViewer component
  const formattedProtocolDeviationData = formatSelfRagData(protocolDeviationData);
  const formattedGuidelinesData = formatSelfRagData(guidelinesData);

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-6 text-sm">
          <div 
            className="flex items-center cursor-pointer hover:opacity-80"
            onClick={() => handleFindingsClick('pd')}
          >
            <CircleDot className="w-4 h-4 mr-2 text-orange-500" />
            <span className="text-gray-600">Protocol Deviation Alerts:</span>
            <span className="ml-1.5 font-semibold">{pdFindings}</span>
          </div>

          <div 
            className="flex items-center cursor-pointer hover:opacity-80"
            onClick={() => handleFindingsClick('ae')}
          >
            <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
            <span className="text-gray-600">Adverse Event Alerts:</span>
            <span className="ml-1.5 font-semibold">{aeFindings}</span>
          </div>

          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center cursor-pointer hover:opacity-80"
              onClick={() => {
                setActiveDataType('protocol');
                setShowDataViewer(true);
              }}
            >
              <Database className="w-4 h-4 mr-2 text-purple-500" />
              <span className="text-gray-600">View Protocol Data</span>
            </div>
            
            <div 
              className="flex items-center cursor-pointer hover:opacity-80"
              onClick={() => {
                setActiveDataType('guidelines');
                setShowDataViewer(true);
              }}
            >
              <Database className="w-4 h-4 mr-2 text-blue-500" />
              <span className="text-gray-600">View Guidelines Data</span>
            </div>
          </div>
        </div>
      </div>

      {showDataViewer && (
        <DataViewer 
          data={activeDataType === 'protocol' ? formattedProtocolDeviationData : formattedGuidelinesData}
          onClose={() => setShowDataViewer(false)}
        />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-none border-b pb-4">
            <DialogTitle className="text-xl font-semibold">{dialogTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {selectedContent.conclusion && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        h3: ({ children }) => <h3 className="text-lg font-semibold mb-4 text-gray-900">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-700 leading-relaxed mb-4">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-2">{children}</ul>,
                        li: ({ children }) => <li className="text-gray-700">{children}</li>,
                      }}
                    >
                      {selectedContent.conclusion}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
              
              <div className="bg-white rounded-lg shadow">
                {renderTable()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};