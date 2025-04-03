import React from 'react';
import { AlertTriangle, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface Finding {
  id: string;
  title: string;
  site: string;
  agent: string;
  severity: 'high' | 'medium' | 'low';
  tags: string[];
}

interface HighPriorityFindingsProps {
  findings: Finding[];
}

export const HighPriorityFindings: React.FC<HighPriorityFindingsProps> = ({ findings }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-destructive bg-destructive/10';
      case 'medium':
        return 'text-warning bg-warning/10';
      case 'low':
        return 'text-success bg-success/10';
      default:
        return '';
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">High-Priority Findings</h2>
      <div className="space-y-3">
        {findings.map((finding) => (
          <div key={finding.id} className="p-3 rounded-md bg-muted/30">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <AlertTriangle className={cn(
                  "h-5 w-5 mt-1",
                  finding.severity === 'high' ? "text-destructive" :
                  finding.severity === 'medium' ? "text-warning" : "text-success"
                )} />
                <div>
                  <h3 className="font-medium text-foreground">{finding.title}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-muted-foreground">{finding.site}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{finding.agent}</span>
                  </div>
                </div>
              </div>
              <Link 
                to={`/findings/${finding.id}`}
                className="text-primary hover:text-primary/80 flex items-center text-sm"
              >
                View <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={cn(
                "px-2 py-1 rounded-full text-xs font-medium",
                getSeverityColor(finding.severity)
              )}>
                {finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1)} Priority
              </span>
              {finding.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 