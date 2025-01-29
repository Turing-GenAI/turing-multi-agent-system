import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import TreePane from './TreePane';
import BreadcrumbTrail from './BreadcrumbTrail';
import TreeMiniMap from './TreeMiniMap';
import KeyboardNavigation from './KeyboardNavigation';
import QuickActions from './QuickActions';
import { activities } from '../data/activities';
import { motion, AnimatePresence } from 'framer-motion';

interface TreeNode {
  title: string;
  summary?: string;
  content?: string;
  children?: TreeNode[];
  fullPath?: string;
  hasChildren?: boolean;
}

interface PathNode {
  title: string;
  color: string;
}

interface MainLayoutProps {
  onNodeSelect?: (node: TreeNode) => void;
}

interface FlatNode extends TreeNode {
  fullPath: string;
  hasChildren: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onNodeSelect }) => {
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [displayedActivities, setDisplayedActivities] = useState<TreeNode[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Simulate dynamic node addition
  useEffect(() => {
    const addNodesSequentially = async () => {
      // Create a flat list of nodes in depth-first order
      const buildNodeList = (nodes: TreeNode[], parentPath = ''): FlatNode[] => {
        const result: FlatNode[] = [];
        
        for (const node of nodes) {
          const currentPath = parentPath ? `${parentPath}/${node.title}` : node.title;
          
          // Add current node
          result.push({
            title: node.title,
            fullPath: currentPath,
            summary: node.summary,
            content: node.content,
            hasChildren: Boolean(node.children && node.children.length > 0)
          });

          // Recursively add children before moving to siblings
          if (node.children && node.children.length > 0) {
            result.push(...buildNodeList(node.children, currentPath));
          }
        }
        
        return result;
      };

      const allNodes = buildNodeList(activities);
      
      // Add nodes one by one
      for (let i = 0; i < allNodes.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const currentNode = allNodes[i];
        const pathParts = currentNode.fullPath.split('/');

        setDisplayedActivities(prev => {
          const newActivities = [...prev];
          
          // Navigate to the correct level
          let currentLevel: TreeNode[] = newActivities;
          for (let j = 0; j < pathParts.length - 1; j++) {
            const part = pathParts[j];
            let existingNode = currentLevel.find(n => n.title === part);
            
            // Create parent node if it doesn't exist
            if (!existingNode) {
              existingNode = {
                title: part,
                children: []
              };
              currentLevel.push(existingNode);
            }
            
            // Ensure children array exists
            if (!existingNode.children) {
              existingNode.children = [];
            }
            
            currentLevel = existingNode.children;
          }
          
          // Add the current node
          const lastPart = pathParts[pathParts.length - 1];
          if (!currentLevel.find(n => n.title === lastPart)) {
            currentLevel.push({
              title: lastPart,
              children: [],
              summary: currentNode.summary,
              content: currentNode.content
            });
          }
          
          return [...newActivities];
        });

        // Update expanded nodes to only include the current path
        const parentNodes = pathParts.slice(0, -1);
        setExpandedNodes(prev => {
          // Get all currently expanded nodes that are in the current path
          const newExpanded = new Set(parentNodes);
          return Array.from(newExpanded);
        });

        // Select the current node
        const nodeToSelect = allNodes[i];
        setSelectedNode({
          title: nodeToSelect.title,
          summary: nodeToSelect.summary,
          content: nodeToSelect.content
        });
      }
    };

    addNodesSequentially();
  }, []);

  const handleNodeSelect = useCallback((node: TreeNode) => {
    setSelectedNode(node);
    onNodeSelect?.(node); // Pass selected node to parent
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [isMobile, onNodeSelect]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleExpand = useCallback((nodeTitle: string) => {
    setExpandedNodes((prev) =>
      prev.includes(nodeTitle)
        ? prev.filter((title) => title !== nodeTitle)
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
    setExpandedNodes(getAllNodeTitles(activities));
  }, []);

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

  // Calculate path for breadcrumb
  const nodePath = useMemo((): PathNode[] => {
    if (!selectedNode) return [];
    
    const path: PathNode[] = [];
    const findPath = (nodes: TreeNode[], targetNode: TreeNode): boolean => {
      for (const node of nodes) {
        if (node === targetNode) {
          path.push({
            title: node.title,
            color: '#2196f3',
          });
          return true;
        }
        if (node.children) {
          if (findPath(node.children, targetNode)) {
            path.unshift({
              title: node.title,
              color: '#4caf50',
            });
            return true;
          }
        }
      }
      return false;
    };
    
    findPath(activities, selectedNode);
    return path;
  }, [selectedNode]);

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
              onNodeSelect={handleNodeSelect}
              selectedNode={selectedNode}
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
            {nodePath.length > 0 && (
              <BreadcrumbTrail path={nodePath} />
            )}
          </AnimatePresence>
        </Box>
        <QuickActions
          onExpandAll={handleExpandAll}
          onCollapseAll={handleCollapseAll}
          showKeyboardShortcuts={showKeyboardShortcuts}
        />
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
          onNodeSelect={handleNodeSelect}
          selectedNode={selectedNode}
          expandedNodes={expandedNodes}
          onToggleExpand={handleToggleExpand}
        />
      </Box>

      <KeyboardNavigation
        data={activities}
        selectedNode={selectedNode}
        onNodeSelect={handleNodeSelect}
        onToggleExpand={handleToggleExpand}
      />

      <TreeMiniMap
        data={activities}
        selectedNode={selectedNode}
        onNavigate={handleNodeSelect}
      />

      <QuickActions
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        showKeyboardShortcuts={showKeyboardShortcuts}
      />
    </Box>
  );
};

export default MainLayout;
