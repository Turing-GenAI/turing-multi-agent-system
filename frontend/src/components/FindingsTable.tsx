import React, { useMemo } from 'react';
import { ChevronDown, ChevronRight, AlertCircle, ArrowUpCircle, Eye, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Finding, FindingCategory } from '../types';
import { FindingCard } from './findings/FindingCard';
import { FindingsSummary } from './findings/FindingsSummary';

interface FindingsTableProps {
  selectedFindingTab: string;
  setSelectedFindingTab: (value: string) => void;
  findings: Finding[];
  expandedRows: string[];
  setExpandedRows: (value: string[]) => void;
}

const tabToCategoryMap: Record<string, FindingCategory> = {
  'pd': 'Protocol Deviation',
  'ae': 'Adverse Event',
  'sgr': 'Site Generated Report'
};

export const FindingsTable: React.FC<FindingsTableProps> = ({
  selectedFindingTab,
  setSelectedFindingTab,
  findings,
  expandedRows,
  setExpandedRows,
}) => {
  const toggleRow = (id: string) => {
    setExpandedRows(
      expandedRows.includes(id)
        ? expandedRows.filter((rowId) => rowId !== id)
        : [...expandedRows, id]
    );
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Major':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const filteredFindings = useMemo(() => {
    const category = tabToCategoryMap[selectedFindingTab];
    return findings.filter(finding => finding.category === category);
  }, [findings, selectedFindingTab]);

  return (
    <div className="bg-white rounded-lg shadow-sm h-[600px] flex flex-col">
      <div className="p-4 border-b space-y-4">
        <FindingsSummary findings={findings} />
        <Tabs value={selectedFindingTab} onValueChange={setSelectedFindingTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="pd">Protocol Deviations</TabsTrigger>
            <TabsTrigger value="ae">Adverse Events</TabsTrigger>
            <TabsTrigger value="sgr">Site Generated Reports</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="h-[520px] overflow-y-auto">
        <div className="p-4 space-y-4">
          {filteredFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </div>
    </div>
  );
};