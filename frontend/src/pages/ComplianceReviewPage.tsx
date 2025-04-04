import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  History
} from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from '../components/ui/badge';
import { useToast } from "../components/ui/use-toast";
import { Skeleton } from "../components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import ComplianceWarningCard from '../components/compliance/ComplianceWarningCard';
import DocumentViewer from '../components/compliance/DocumentViewer';
import HistoryDialog from '../components/compliance/HistoryDialog';

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

interface ComplianceReview {
  document_id: string;
  document_title: string;
  compliance_doc_id: string;
  compliance_doc_title: string;
  violations: Violation[];
  timestamp: string;
  status: string;
}

const ComplianceReviewPage: React.FC = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const [review, setReview] = useState<ComplianceReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentViolationIndex, setCurrentViolationIndex] = useState(0);
  const [trialDocument, setTrialDocument] = useState<string>('');
  const [complianceDocument, setComplianceDocument] = useState<string>('');
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (reviewId) {
      fetchReviewData();
    } else {
      setLoading(false);
    }
  }, [reviewId]);

  // Simple API client for the demo
const api = {
  get: async (_url: string) => {
    // Mock data for demo purposes
    return {
      data: {
        review: {
          document_id: "doc123",
          document_title: "Clinical Trial Protocol XYZ-123",
          compliance_doc_id: "comp456",
          compliance_doc_title: "21 CFR § 801.109(c) - Prescription Devices",
          violations: Array(5).fill(null).map((_, i) => ({
            trial_text: `This is a non-compliant section ${i+1} of the trial document.`,
            compliance_text: `This is the related compliance rule ${i+1} that is being violated.`,
            trial_location: { start: 100*i, end: 100*i + 80 },
            compliance_location: { start: 200*i, end: 200*i + 70 },
            explanation: `This text violates compliance rule ${i+1} because it does not meet the required standards.`,
            suggested_edit: `This is a suggested compliant revision ${i+1} of the section.`,
            confidence: i % 2 === 0 ? 'high' as const : 'low' as const,
            status: 'pending' as const
          })),
          timestamp: new Date().toISOString(),
          status: "in-review"
        }
      }
    };
  },
  patch: async (_url: string, _data: any) => {
    // Mock successful response
    return { data: { success: true } };
  }
};

const fetchReviewData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/compliance-review/${reviewId}`);
      setReview(response.data.review);
      
      // In a real implementation, we would fetch the actual document content
      // For now, we'll simulate with the trial and compliance text from violations
      if (response.data.review.violations.length > 0) {
        const allText = response.data.review.violations.map((v: Violation) => v.trial_text).join('\n\n');
        setTrialDocument(allText);
        
        const allComplianceText = response.data.review.violations.map((v: Violation) => v.compliance_text).join('\n\n');
        setComplianceDocument(allComplianceText);
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch review data');
      setLoading(false);
    }
  };

  const handleViolationAction = async (index: number, action: 'accepted' | 'rejected') => {
    if (!review) return;
    
    try {
      const response = await api.patch(`/compliance-review/${reviewId}/violations/${index}`, {
        status: action
      });
      
      // Update the local state
      setReview(prevReview => {
        if (!prevReview) return null;
        
        const updatedViolations = [...prevReview.violations];
        updatedViolations[index] = {
          ...updatedViolations[index],
          status: action
        };
        
        return {
          ...prevReview,
          violations: updatedViolations
        };
      });
      
      toast({
        title: `Violation ${action}`,
        description: action === 'accepted' ? 'This warning has been flagged for resolution.' : 'This warning has been dismissed.',
      });
    } catch (err: any) {
      toast({
        title: 'Action failed',
        description: err.message || 'Failed to update violation status',
        variant: 'destructive'
      });
    }
  };

  const handleAlertOwners = () => {
    toast({
      title: 'Notifications sent',
      description: 'All document owners have been notified of the compliance issues.',
    });
  };

  const goToPreviousViolation = () => {
    if (currentViolationIndex > 0) {
      setCurrentViolationIndex(currentViolationIndex - 1);
    }
  };

  const goToNextViolation = () => {
    if (review && currentViolationIndex < review.violations.length - 1) {
      setCurrentViolationIndex(currentViolationIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => navigate('/compliance')} className="mt-4">
              Return to Compliance Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Review Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Select a compliance review to get started, or upload a new document for review.</p>
            <Button onClick={() => navigate('/compliance')} className="mt-4">
              Go to Compliance Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentViolation = review.violations[currentViolationIndex];
  const violationsCount = review.violations.length;
  const acceptedCount = review.violations.filter(v => v.status === 'accepted').length;
  const rejectedCount = review.violations.filter(v => v.status === 'rejected').length;
  const pendingCount = violationsCount - acceptedCount - rejectedCount;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold">{review.document_title}</h1>
          <p className="text-muted-foreground">
            Compliance review against <span className="font-medium">{review.compliance_doc_title}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowHistoryDialog(true)}>
            <History className="mr-2 h-4 w-4" />
            View History
          </Button>
          <Button variant="default" size="sm" onClick={handleAlertOwners}>
            <Bell className="mr-2 h-4 w-4" />
            Alert Document Owners
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Issues</p>
              <p className="text-2xl font-bold">{violationsCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Accepted</p>
              <p className="text-2xl font-bold">{acceptedCount}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Document View</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={currentViolation.confidence === 'high' ? 'destructive' : 'outline'}>
                    {currentViolation.confidence === 'high' ? 'High Confidence' : 'Low Confidence'}
                  </Badge>
                  <Badge>{`${currentViolationIndex + 1} of ${violationsCount}`}</Badge>
                </div>
              </div>
              <CardDescription>
                {review.document_title}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden">
              <div className="mb-4 flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={goToPreviousViolation}
                  disabled={currentViolationIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={goToNextViolation}
                  disabled={currentViolationIndex === violationsCount - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <DocumentViewer 
                document={trialDocument}
                highlightText={currentViolation.trial_text}
                highlightType={currentViolation.confidence === 'high' ? 'high' : 'low'}

              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Tabs defaultValue="warning" className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="warning">Warning</TabsTrigger>
              <TabsTrigger value="compliance">Compliance Doc</TabsTrigger>
              <TabsTrigger value="edit">Suggested Edit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="warning" className="flex-grow">
              <ComplianceWarningCard
                violation={currentViolation}

                onAccept={() => handleViolationAction(currentViolationIndex, 'accepted')}
                onReject={() => handleViolationAction(currentViolationIndex, 'rejected')}
              />
            </TabsContent>
            
            <TabsContent value="compliance" className="flex-grow">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    Compliance Reference
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="ml-2 h-6 w-6">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="space-y-2">
                          <h4 className="font-medium">21 CFR § 801.109(c)</h4>
                          <p className="text-sm text-muted-foreground">Open compliance document</p>
                          <p className="text-xs border-l-2 border-primary pl-2 py-1">
                            {currentViolation.compliance_text}
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </CardTitle>
                  <CardDescription>
                    {review.compliance_doc_title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow overflow-hidden">
                  <DocumentViewer 
                    document={complianceDocument}
                    highlightText={currentViolation.compliance_text}
                    highlightType="reference"
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="edit" className="flex-grow">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle>Suggested Edit</CardTitle>
                  <CardDescription>
                    AI-generated recommendation for fixing the compliance issue
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium mb-2">Original Text:</h3>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 px-1">
                        {currentViolation.trial_text}
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Suggested Revision:</h3>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      <span className="bg-green-100 dark:bg-green-900/30 px-1">
                        {currentViolation.suggested_edit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => handleViolationAction(currentViolationIndex, 'rejected')}>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button variant="default" onClick={() => handleViolationAction(currentViolationIndex, 'accepted')}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {showHistoryDialog && (
        <HistoryDialog 
          open={showHistoryDialog}
          onOpenChange={setShowHistoryDialog}
          reviewId={reviewId || ''}
          violations={review.violations}
        />
      )}
    </div>
  );
};

export default ComplianceReviewPage;
