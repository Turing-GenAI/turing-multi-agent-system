import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import TreePane from './TreePane';
import BreadcrumbTrail from './BreadcrumbTrail';
import TreeMiniMap from './TreeMiniMap';
import KeyboardNavigation from './KeyboardNavigation';
import QuickActions from './QuickActions';
import { TreeNode, PathNode } from '../../../data/activities'
import { motion, AnimatePresence } from 'framer-motion';

interface QuickActionsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  showKeyboardShortcuts: () => void;
  onToggleSearch: () => void;
  onToggleFilters: () => void;
}

interface ProgressTreeProps {
  type: 'tree' | 'minimap' | 'full';
  value: TreeNode[];
  onChange: (node: TreeNode | null) => void;
  options?: {
    showBreadcrumbs?: boolean;
    showKeyboardNav?: boolean;
    showQuickActions?: boolean;
    initialExpandedNodes?: string[];
    animationDuration?: number;
  };
}

const ProgressTree: React.FC<ProgressTreeProps> = ({ 
  type, 
  value: activities = [], 
  onChange: onNodeSelect,
  options = {} 
}) => {
  const {
    showBreadcrumbs = true,
    showKeyboardNav = true,
    showQuickActions = true,
    initialExpandedNodes = [],
    animationDuration = 800
  } = options;

  console.log(" activities : ", activities);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>(initialExpandedNodes);
  const [displayedActivities, setDisplayedActivities] = useState<TreeNode[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const updateNodeStatus = useCallback((nodes: TreeNode[], path: string[], newStatus: 'pending' | 'in progress' | 'complete'): TreeNode[] => {
    return nodes.map(node => {
      if (path.length === 0) return node;

      if (node.title === path[0]) {
        if (path.length === 1) {
          if (newStatus === 'in progress' && node.children) {
            const hasInProgressChild = node.children.some(child => child.status === 'in progress');
            if (hasInProgressChild) return node;
          }
          
          if (newStatus === 'complete' && node.children) {
            const allChildrenComplete = node.children.every(child => child.status === 'complete');
            if (!allChildrenComplete) return node;
          }
          
          return { ...node, status: newStatus };
        }
        
        return {
          ...node,
          children: node.children ? updateNodeStatus(node.children, path.slice(1), newStatus) : undefined
        };
      }
      return node;
    });
  }, []);

  const updateNodeStatusAndExpand = useCallback(async (path: string[], newStatus: 'pending' | 'in progress' | 'complete') => {
    // Helper function to get all node titles from a path
    const getNodeTitlesFromPath = (path: string[]): string[] => {
      // This will store all parent paths
      const paths: string[] = [];
      let currentPath = '';
      
      // Build paths incrementally
      path.forEach((segment, index) => {
        if (index === 0) {
          currentPath = segment;
        } else {
          currentPath = `${currentPath}.${segment}`;
        }
        paths.push(currentPath);
      });
      
      return paths;
    };

    // Update the status
    setDisplayedActivities(prev => updateNodeStatus(prev, path, newStatus));
    
    // Get all parent paths and expand them
    const nodePaths = getNodeTitlesFromPath(path);
    setExpandedNodes(prev => [...new Set([...prev, ...nodePaths])]);
    
    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, animationDuration));
  }, [animationDuration, updateNodeStatus]);

  useEffect(() => {
    const addNodesSequentially = async () => {
      // Initial state - all nodes pending
      setDisplayedActivities(activities.map(node => ({ ...node, status: 'pending' })));
      
      // Protocol deviation to In Progress
      await updateNodeStatusAndExpand(['Protocol deviation'], 'in progress');
      
      // Activity ID 1 to In Progress
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1'], 'in progress');
      
      // Inspection Master progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master'], 'in progress');
      
      // Inspection Master children progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master', 'Planned sub-activities'], 'complete');
      
      // Inspection Master children progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Inspection Master'], 'complete');
      
      // Planner Agent progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent'], 'in progress');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent', 'Planned sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Planner Agent'], 'complete');
      
      // Critique agent progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent'], 'in progress');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent', 'Planned sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Critique agent'], 'complete');
      
      // Feedback agent progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent'], 'in progress');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent', 'Planned sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1', 'Feedback agent'], 'complete');
      
      // Complete Activity ID 1 after all children are complete
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 1'], 'complete');
      
      // Start Activity ID 2 progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2'], 'in progress');
      
      // Inspection Master progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master'], 'in progress');
      
      // Inspection Master children progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master', 'Planned sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Inspection Master'], 'complete');
      
      // Planner Agent progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent'], 'in progress');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent', 'Planned sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Planner Agent'], 'complete');
      
      // Critique agent progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent'], 'in progress');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent', 'Planned sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Critique agent'], 'complete');
      
      // Feedback agent progression
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent'], 'in progress');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent', 'Planned sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent', 'Planned sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent', 'Recommendation on the plan'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent', 'Recommendation on the plan'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent', 'Reworked sub-activities'], 'in progress');
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent', 'Reworked sub-activities'], 'complete');
      
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2', 'Feedback agent'], 'complete');
      
      // Complete Activity ID 2 after all children are complete
      await updateNodeStatusAndExpand(['Protocol deviation', 'Activity ID 2'], 'complete');
      
      // Finally complete Protocol deviation after both activities are complete
      await updateNodeStatusAndExpand(['Protocol deviation'], 'complete');
      
      // Expand all nodes initially
      const expandAll = (nodes: TreeNode[]): string[] => {
        return nodes.reduce<string[]>((acc, node) => {
          acc.push(node.title);
          if (node.children) {
            acc.push(...expandAll(node.children));
          }
          return acc;
        }, []);
      };

      setExpandedNodes(expandAll(activities));
      console.log('Activities', activities);
      const allNodes = buildNodeList(activities);
      
      for (let i = 0; i < allNodes.length; i++) {
        await new Promise(resolve => setTimeout(resolve, animationDuration));
        const currentNode = allNodes[i];
        const pathParts = currentNode.fullPath?.split('/') || [];

        setDisplayedActivities(prev => {
          const newActivities = [...prev];
          let currentLevel = newActivities;
          
          for (let j = 0; j < pathParts.length - 1; j++) {
            const part = pathParts[j];
            let existingNode = currentLevel.find(n => n.title === part);
            if (!existingNode) {
              existingNode = { title: part, children: [] };
              currentLevel.push(existingNode);
            }
            currentLevel = existingNode.children || [];
          }

          const lastPart = pathParts[pathParts.length - 1];
          if (!currentLevel.find(n => n.title === lastPart)) {
            currentLevel.push({
              ...currentNode,
              children: currentNode.children || []
            });
          }

          return [...newActivities];
        });

        setExpandedNodes(prev => {
          const parentNodes = pathParts.slice(0, -1);
          return Array.from(new Set([...prev, ...parentNodes]));
        });

        onNodeSelect(currentNode);
      }
    };

    addNodesSequentially();
  }, [animationDuration, updateNodeStatus]);

  const handleToggleExpand = useCallback((nodeTitle: string) => {
    setExpandedNodes(prev =>
      prev.includes(nodeTitle)
        ? prev.filter(title => title !== nodeTitle)
        : [...prev, nodeTitle]
    );
  }, []);

  const handleExpandAll = useCallback(() => {
    const getAllNodeTitles = (nodes: TreeNode[]): string[] => {
      return nodes.reduce<string[]>((titles, node) => {
        titles.push(node.title);
        if (node.children) {
          titles.push(...getAllNodeTitles(node.children));
        }
        return titles;
      }, []);
    };
    setExpandedNodes(getAllNodeTitles(displayedActivities));
  }, [displayedActivities]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes([]);
  }, []);

  const showKeyboardShortcuts = useCallback(() => {
    alert(`
Keyboard Shortcuts:
↑ Up Arrow: Navigate to previous node
↓ Down Arrow: Navigate to next node
← Left Arrow: Navigate to parent node
→ Right Arrow: Navigate to first child node
Enter: Toggle expand/collapse
    `);
  }, []);

  const quickActionsProps: QuickActionsProps = {
    onExpandAll: handleExpandAll,
    onCollapseAll: handleCollapseAll,
    showKeyboardShortcuts,
    onToggleSearch: () => {},
    onToggleFilters: () => {}
  };

  const nodePath = useMemo((): PathNode[] => {
    if (!activities) return [];
    
    const path: PathNode[] = [];
    const findPath = (nodes: TreeNode[], targetNode: TreeNode): boolean => {
      for (const node of nodes) {
        if (node === targetNode) {
          path.push({ title: node.title, color: '#2196f3' });
          return true;
        }
        if (node.children && findPath(node.children, targetNode)) {
          path.unshift({ title: node.title, color: '#4caf50' });
          return true;
        }
      }
      return false;
    };
    
    findPath(activities, activities[0]);
    return path;
  }, [activities]);

  switch (type) {
    case 'minimap':
      return (
        <TreeMiniMap
          data={activities}
          selectedNode={activities.length > 0 ? activities[0] : null}
          onNavigate={onNodeSelect}
        />
      );

    case 'tree':
      return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3 }}>
          <TreePane
            data={displayedActivities}
            onNodeSelect={onNodeSelect}
            selectedNode={activities.length > 0 ? activities[0] : null}
            expandedNodes={expandedNodes}
            onToggleExpand={handleToggleExpand}
          />
        </Box>
      );

    default:
      if (isMobile) {
        return (
          <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {mobileOpen && (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  bgcolor: 'background.paper',
                  zIndex: 1200,
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                <TreePane
                  data={displayedActivities}
                  onNodeSelect={(node) => {
                    onNodeSelect(node);
                    setMobileOpen(false);
                  }}
                  selectedNode={activities.length > 0 ? activities[0] : null}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                />
              </Box>
            )}
            <Box
              component={motion.main}
              layout
              sx={{
                flexGrow: 1,
                height: '100%',
                overflow: 'auto',
                bgcolor: 'background.default',
                p: 2,
              }}
            >
              <AnimatePresence mode="wait">
                {showBreadcrumbs && nodePath.length > 0 && (
                  <BreadcrumbTrail path={nodePath} />
                )}
              </AnimatePresence>
            </Box>
            {showQuickActions && <QuickActions {...quickActionsProps} />}
          </Box>
        );
      }

      return (
        <Box sx={{ width: '100%', bgcolor: 'grey.100' }}>
          <Box
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
              m: 1,
            }}
          >
            <TreePane
              data={displayedActivities}
              onNodeSelect={onNodeSelect}
              selectedNode={activities.length > 0 ? activities[0] : null}
              expandedNodes={expandedNodes}
              onToggleExpand={handleToggleExpand}
            />
          </Box>

          {/* {showKeyboardNav && (
            <KeyboardNavigation
              data={activities}
              selectedNode={activities.length > 0 ? activities[0] : null}
              onNodeSelect={onNodeSelect}
              onToggleExpand={handleToggleExpand}
            />
          )} */}

          {/* {showMiniMap && (
            <TreeMiniMap
              data={activities}
              selectedNode={activities.length > 0 ? activities[0] : null}
              onNavigate={onNodeSelect}
            />
          )} */}

          {/* {showQuickActions && (
            <QuickActions
              onExpandAll={handleExpandAll}
              onCollapseAll={handleCollapseAll}
              showKeyboardShortcuts={showKeyboardShortcuts}
              onToggleSearch={handleToggleSearch}
              onToggleFilters={handleToggleFilters}
            />
          )} */}
        </Box>
      );
  }
};

export default ProgressTree;
