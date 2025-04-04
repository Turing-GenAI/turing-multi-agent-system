import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Violation {
  trial_text: string;
  compliance_text: string;
  trial_location: { start: number; end: number };
  compliance_location: { start: number; end: number };
  explanation: string;
  suggested_edit: string;
  confidence: 'high' | 'low';
  status: 'accepted' | 'rejected' | 'pending';
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewId: string;
  violations: Violation[];
}

const HistoryDialog: React.FC<HistoryDialogProps> = ({
  open,
  onOpenChange,
  reviewId,
  violations
}) => {
  // Function to truncate text if it's too long
  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to render status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Review History</DialogTitle>
          <DialogDescription>
            All decisions made for review #{reviewId}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Status</TableHead>
                <TableHead>Warning</TableHead>
                <TableHead>Compliance Reference</TableHead>
                <TableHead className="w-[100px]">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violations.map((violation, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {renderStatusIcon(violation.status)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {truncateText(violation.trial_text)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {truncateText(violation.compliance_text)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={violation.confidence === 'high' ? 'destructive' : 'outline'}>
                      {violation.confidence}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default HistoryDialog;
