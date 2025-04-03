import React from 'react';
import { Play, Search, FileText, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  link: string;
  description: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export const QuickActions: React.FC<QuickActionsProps> = ({ actions }) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-4">
      <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actions.map((action) => (
          <Link
            key={action.id}
            to={action.link}
            className="group p-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                {action.icon}
              </div>
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}; 