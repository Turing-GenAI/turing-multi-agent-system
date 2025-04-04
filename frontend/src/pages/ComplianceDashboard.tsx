import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle, 
  CardFooter
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { 
  UploadCloud, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  FileText,
  ExternalLink
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { Label } from "../components/ui/label";

// Simple mock API client for the demo
const api = {
  get: async (_url: string) => {
    // Mock data for demo purposes
    return {
      data: {
        reviews: Array(10).fill(null).map((_, i) => ({
          review_id: `rev-${i+1}`,
          document_title: `Clinical Trial Protocol ${String.fromCharCode(65 + i)}-${i*10 + 100}`,
          violations_count: Math.floor(Math.random() * 10) + 1,
          timestamp: new Date(Date.now() - i * 86400000).toISOString(), // Each day before now
          status: i % 3 === 0 ? 'complete' : 'in-progress'
        }))
      }
    };
  },
  post: async (_url: string, _data: any, _config: any) => {
    // Mock successful response for uploads
    return {
      data: {
        review_id: `rev-${Math.floor(Math.random() * 1000)}`,
        success: true
      }
    };
  }
};

interface ReviewItem {
  review_id: string;
  document_title: string;
  violations_count: number;
  timestamp: string;
  status: string;
}

const ComplianceDashboard: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [trialDocument, setTrialDocument] = useState<File | null>(null);
  const [complianceDocument, setComplianceDocument] = useState<File | null>(null);
  const [trialDocTitle, setTrialDocTitle] = useState('');
  const [complianceDocTitle, setComplianceDocTitle] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/compliance-reviews/');
      setReviews(response.data.reviews || []);
      setLoading(false);
    } catch (err: any) {
      toast({
        title: 'Failed to fetch reviews',
        description: err.message || 'Could not load compliance reviews',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleViewReview = (reviewId: string) => {
    navigate(`/compliance/review/${reviewId}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'trial' | 'compliance') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (type === 'trial') {
        setTrialDocument(file);
        if (!trialDocTitle) {
          setTrialDocTitle(file.name.split('.')[0]);
        }
      } else {
        setComplianceDocument(file);
        if (!complianceDocTitle) {
          setComplianceDocTitle(file.name.split('.')[0]);
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!trialDocument || !complianceDocument) {
      toast({
        title: 'Missing files',
        description: 'Please upload both trial and compliance documents',
        variant: 'destructive'
      });
      return;
    }

    try {
      setUploadLoading(true);
      
      const formData = new FormData();
      formData.append('trial_doc', trialDocument);
      formData.append('compliance_doc', complianceDocument);
      formData.append('trial_doc_id', new Date().getTime().toString());
      formData.append('compliance_doc_id', new Date().getTime().toString());
      formData.append('trial_doc_title', trialDocTitle || trialDocument.name);
      formData.append('compliance_doc_title', complianceDocTitle || complianceDocument.name);
      
      const response = await api.post('/compliance-review/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadDialogOpen(false);
      
      toast({
        title: 'Upload successful',
        description: 'Documents have been uploaded and are being processed'
      });
      
      // Navigate to the new review
      navigate(`/compliance/review/${response.data.review_id}`);
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err.message || 'Could not upload documents',
        variant: 'destructive'
      });
    } finally {
      setUploadLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => 
    review.document_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simulate data for the demo UI
  const recentReviews = [...Array(4)].map((_, i) => ({
    review_id: `2025040${i + 1}10${i}${i + 2}`,
    document_title: [
      'Informed Consent Form', 
      'Clinical Trial Protocol', 
      'Data Management Plan',
      'Safety Reporting Guidelines'
    ][i],
    violations_count: [2, 4, 1, 3][i],
    timestamp: new Date(2025, 3, i + 1).toISOString(),
    status: ['complete', 'complete', 'in_progress', 'complete'][i]
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Compliance Review</h1>
          <p className="text-muted-foreground">
            Review and validate clinical trial documents against compliance requirements
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Documents reviewed</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">Issues identified</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold">18</p>
                <p className="text-sm text-muted-foreground">Issues resolved</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent">
        <TabsList className="mb-6">
          <TabsTrigger value="recent">Recent Reviews</TabsTrigger>
          <TabsTrigger value="all">All Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentReviews.map((review) => (
              <Card key={review.review_id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>{review.document_title}</CardTitle>
                  <CardDescription>
                    {new Date(review.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                      <span>{review.violations_count} compliance issues</span>
                    </div>
                    <Badge variant={review.status === 'complete' ? 'outline' : 'secondary'}>
                      {review.status === 'complete' ? 'Completed' : 'In Progress'}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 pt-3">
                  <Button 
                    variant="ghost" 
                    className="ml-auto"
                    onClick={() => handleViewReview(review.review_id)}
                  >
                    View Details
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="all">
          <div className="mb-4 flex items-center">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={handleSearch}
              className="max-w-sm"
            />
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>All Compliance Reviews</CardTitle>
              <CardDescription>
                View and manage all document compliance reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Review Date</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReviews.length > 0 ? (
                      filteredReviews.map((review) => (
                        <TableRow key={review.review_id}>
                          <TableCell className="font-medium">{review.document_title}</TableCell>
                          <TableCell>
                            {new Date(review.timestamp).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>{review.violations_count}</TableCell>
                          <TableCell>
                            <Badge variant={review.status === 'complete' ? 'outline' : 'secondary'}>
                              {review.status === 'complete' ? 'Completed' : 'In Progress'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewReview(review.review_id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          {searchTerm ? 'No matching reviews found' : 'No reviews available'}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Sample data for demonstration */}
                    {filteredReviews.length === 0 && !searchTerm && (
                      <>
                        {recentReviews.map((review) => (
                          <TableRow key={review.review_id}>
                            <TableCell className="font-medium">{review.document_title}</TableCell>
                            <TableCell>
                              {new Date(review.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>{review.violations_count}</TableCell>
                            <TableCell>
                              <Badge variant={review.status === 'complete' ? 'outline' : 'secondary'}>
                                {review.status === 'complete' ? 'Completed' : 'In Progress'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewReview(review.review_id)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Upload Documents for Review</DialogTitle>
            <DialogDescription>
              Upload a clinical trial document and a compliance document to compare them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trial-doc" className="text-right">
                Trial Document
              </Label>
              <div className="col-span-3">
                <Input
                  id="trial-doc"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileChange(e, 'trial')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="trial-title" className="text-right">
                Document Title
              </Label>
              <Input
                id="trial-title"
                className="col-span-3"
                value={trialDocTitle}
                onChange={(e) => setTrialDocTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="compliance-doc" className="text-right">
                Compliance Doc
              </Label>
              <div className="col-span-3">
                <Input
                  id="compliance-doc"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileChange(e, 'compliance')}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="compliance-title" className="text-right">
                Document Title
              </Label>
              <Input
                id="compliance-title"
                className="col-span-3"
                value={complianceDocTitle}
                onChange={(e) => setComplianceDocTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploadLoading || !trialDocument || !complianceDocument}>
              {uploadLoading ? 'Uploading...' : 'Upload and Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplianceDashboard;
