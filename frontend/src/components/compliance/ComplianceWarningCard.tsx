import React from 'react';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "../ui/card";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Separator } from "../ui/separator";
import { Badge } from "../ui/badge";

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

interface ComplianceWarningCardProps {
  violation: Violation;
  onAccept: () => void;
  onReject: () => void;
}

const ComplianceWarningCard: React.FC<ComplianceWarningCardProps> = ({
  violation,
  onAccept,
  onReject
}) => {
  // Determine status badge style
  const getStatusBadge = () => {
    switch (violation.status) {
      case 'accepted':
        return <Badge variant="success">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <AlertTriangle 
              className={`mr-2 h-5 w-5 ${violation.confidence === 'high' ? 'text-red-500' : 'text-yellow-500'}`} 
            />
            Sentence is inaccurate
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Consider rewording per <span className="font-medium">21 CFR § 801.109(c)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
          <div className="text-sm">
            <p>
              It sounds like OTC guidance and doesn't involve a practitioner's direction.
            </p>
          </div>
          
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-1">Current:</h3>
            <div className="p-3 bg-muted rounded-md text-sm">
              "{violation.trial_text}"
            </div>
          </div>
          
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-1">Suggested:</h3>
            <div className="p-3 bg-muted rounded-md text-sm">
              "{violation.suggested_edit}"
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Explanation:</h3>
            <p className="text-sm text-muted-foreground">
              {violation.explanation}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button variant="outline" onClick={onReject} disabled={violation.status !== 'pending'}>
          <XCircle className="mr-2 h-4 w-4" />
          Reject
        </Button>
        <Button variant="default" onClick={onAccept} disabled={violation.status !== 'pending'}>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Accept
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ComplianceWarningCard;
