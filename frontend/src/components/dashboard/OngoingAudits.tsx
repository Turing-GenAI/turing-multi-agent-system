import React from 'react';
import { FileText, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface Audit {
  id: string;
  name: string;
  site: string;
  progress: number;
  nextSteps: string;
  dueDate: Date;
}

interface OngoingAuditsProps {
  audits: Audit[];
}

export const OngoingAudits: React.FC<OngoingAuditsProps> = ({ audits }) => {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Ongoing Audits</h2>
      <div className="space-y-4">
        {audits.map((audit) => (
          <div key={audit.id} className="p-3 rounded-md bg-muted/30">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">{audit.name}</h3>
              </div>
              <Link 
                to={`/audit/${audit.id}`} 
                className="text-primary hover:text-primary/80 flex items-center text-sm"
              >
                View <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="text-sm text-muted-foreground mb-2">
              Site: {audit.site}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Due: {formatDate(audit.dueDate)}
                </span>
              </div>
              <div className="text-sm font-medium text-foreground">
                {audit.progress}% complete
              </div>
            </div>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full", 
                  audit.progress < 30 ? "bg-destructive" : 
                  audit.progress < 70 ? "bg-warning" : "bg-success"
                )}
                style={{ width: `${audit.progress}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Next: {audit.nextSteps}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 