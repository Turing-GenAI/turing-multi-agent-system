import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  onChange: (node: TreeNode & { path: string } | null) => void;
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
    animationDuration = 2000
  } = options;

  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>(initialExpandedNodes);
  const [displayedActivities, setDisplayedActivities] = useState<TreeNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<(TreeNode & { path: string }) | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const previousActivities = useRef<TreeNode[]>([]);
  const animationRef = useRef<number>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Function to compare two trees deeply
  const areTreesEqual = useCallback((tree1: TreeNode[], tree2: TreeNode[]): boolean => {
    if (tree1.length !== tree2.length) return false;

    return tree1.every((node1, index) => {
      const node2 = tree2[index];
      if (node1.name !== node2.name || node1.id != node2.id || node1.status !== node2.status) return false;
      if (node1.children && node2.children) {
        return areTreesEqual(node1.children, node2.children);
      }
      return (!node1.children && !node2.children);
    });
  }, []);

  // Function to get all nodes in depth-first order with their full paths
  const getNodesInOrder = useCallback((nodes: TreeNode[], parentPath: string = ''): { node: TreeNode; path: string }[] => {
    const result: { node: TreeNode; path: string }[] = [];
    
    nodes.forEach(node => {
      const currentPath = parentPath ? `${parentPath}.${node.name}-${node.id}` : `${node.name}-${node.id}`;
      result.push({ node, path: currentPath });
      
      if (node.children) {
        result.push(...getNodesInOrder(node.children, currentPath));
      }
    });
    
    return result;
  }, []);

  // Function to add a node to the tree at its correct position
  const addNodeToTree = useCallback((tree: TreeNode[], path: string[], node: TreeNode): TreeNode[] => {
    if (path.length === 1) {
      if (!tree.find(n => `${n.name}-${n.id}` === path[0])) {
        tree.push({ ...node, children: [], status: 'pending' });
      }
      return tree;
    }

    let parent = tree.find(n => `${n.name}-${n.id}` === path[0]);
    if (!parent) {
      parent = { name: path[0], children: [], status: 'pending' };
      tree.push(parent);
    }

    if (parent.children) {
      parent.children = addNodeToTree(parent.children, path.slice(1), node);
    }

    return tree;
  }, []);

  // Function to check if a node is a leaf node
  const isLeafNode = useCallback((node: TreeNode): boolean => {
    return !node.children || node.children.length === 0;
  }, []);

  // Function to check if all child nodes are present
  const hasAllChildren = useCallback((node: TreeNode, allNodes: Set<string>): boolean => {
    if (!node.children) return true;
    return node.children.every(child => {
      const childPath = `${node.name}-${node.id}.${child.name}-${child.id}`;
      return allNodes.has(childPath) && hasAllChildren(child, allNodes);
    });
  }, []);

  // Function to update node status
  const updateNodeStatus = useCallback((nodes: TreeNode[], path: string[], newStatus: 'pending' | 'in progress' | 'complete', allNodes?: Set<string>): TreeNode[] => {
    // First pass: Update the target node
    const updatedNodes = nodes.map(node => {
      if (path.length === 0) return node;

      if (`${node.name}-${node.id}` === path[0]) {
        if (path.length === 1) {
          // For leaf nodes, allow direct status update
          if (isLeafNode(node)) {
            return { ...node, status: newStatus };
          }
          
          // For non-leaf nodes
          if (node.children && allNodes) {
            // If all children are present, mark as complete
            if (hasAllChildren(node, allNodes)) {
              return { ...node, status: 'complete' };
            }
            // Otherwise, show as in progress while children are being added
            return { ...node, status: 'in progress' };
          }
        }
        
        return {
          ...node,
          children: node.children ? updateNodeStatus(node.children, path.slice(1), newStatus, allNodes) : undefined
        };
      }
      return node;
    });

    // Second pass: Check if we need to update parent statuses
    if (newStatus === 'complete') {
      const allCurrentPaths = new Set(getNodesInOrder(updatedNodes).map(n => n.path));
      return updatedNodes.map(node => {
        if (!isLeafNode(node)) {
          // Check if all children are complete
          const allChildrenComplete = node.children?.every(child => child.status === 'complete') ?? false;
          if (allChildrenComplete) {
            return { ...node, status: 'complete' };
          } else if (node.children?.some(child => child.status === 'complete' || child.status === 'in progress')) {
            return { ...node, status: 'in progress' };
          }
        }
        return node;
      });
    }

    return updatedNodes;
  }, [isLeafNode, hasAllChildren, getNodesInOrder]);

  // Effect to handle initial load and updates
  useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (activities.length === 0) return;

    // Check if this is just a re-render with the same data
    if (!isInitialLoad && areTreesEqual(activities, previousActivities.current)) {
      return;
    }

    // Update previous activities reference
    previousActivities.current = activities;

    // If it's not initial load, check what nodes are new
    if (!isInitialLoad) {
      const currentNodes = new Set(getNodesInOrder(displayedActivities).map(n => n.path));
      const newNodes = getNodesInOrder(activities).filter(n => !currentNodes.has(n.path));

      // Only animate new nodes
      if (newNodes.length > 0) {
        let currentIndex = 0;
        const addNewNodesSequentially = () => {
          if (currentIndex >= newNodes.length) {
            // When all nodes are added, update parent statuses
            const allPaths = new Set(getNodesInOrder(activities).map(n => n.path));
            setDisplayedActivities(prev => {
              return prev.map(node => {
                if (!isLeafNode(node) && hasAllChildren(node, allPaths)) {
                  return { ...node, status: 'complete' };
                }
                return node;
              });
            });
            return;
          }

          const { node, path } = newNodes[currentIndex];
          const pathParts = path.split('.');
          const allCurrentPaths = new Set([...currentNodes, ...newNodes.slice(0, currentIndex + 1).map(n => n.path)]);

          setDisplayedActivities(prev => {
            const newTree = [...prev];
            const updatedTree = addNodeToTree(newTree, pathParts, { ...node, status: 'pending' });
            // After a longer delay, update to in progress
            setTimeout(() => {
              setDisplayedActivities(prev => updateNodeStatus(prev, pathParts, 'in progress', allCurrentPaths));
            }, animationDuration / 2);
            return updatedTree;
          });

          // For leaf nodes, complete after animation
          if (isLeafNode(node)) {
            setTimeout(() => {
              setDisplayedActivities(prev => updateNodeStatus(prev, pathParts, 'complete'));
            }, animationDuration);
          }

          setExpandedNodes(prev => Array.from(new Set([...prev, path])));

          currentIndex++;
          animationRef.current = requestAnimationFrame(() => {
            setTimeout(addNewNodesSequentially, animationDuration / 2);
          });
        };

        addNewNodesSequentially();
      }
    } else {
      // Similar logic for initial load
      const orderedNodes = getNodesInOrder(activities);
      let currentIndex = 0;

      const addNodesSequentially = () => {
        if (currentIndex >= orderedNodes.length) {
          // When all nodes are added, update parent statuses
          const allPaths = new Set(orderedNodes.map(n => n.path));
          setDisplayedActivities(prev => {
            return prev.map(node => {
              if (!isLeafNode(node) && hasAllChildren(node, allPaths)) {
                return { ...node, status: 'complete' };
              }
              return node;
            });
          });
          setIsInitialLoad(false);
          return;
        }

        const { node, path } = orderedNodes[currentIndex];
        const pathParts = path.split('.');
        
        const allCurrentPaths = new Set(orderedNodes.slice(0, currentIndex + 1).map(n => n.path));

        setDisplayedActivities(prev => {
          const newTree = [...prev];
          const updatedTree = addNodeToTree(newTree, pathParts, { ...node, status: 'pending' });
          // After a longer delay, update to in progress
          setTimeout(() => {
            setDisplayedActivities(prev => updateNodeStatus(prev, pathParts, 'in progress', allCurrentPaths));
          }, animationDuration / 2);
          return updatedTree;
        });

        // For leaf nodes, complete after animation
        if (isLeafNode(node)) {
          setTimeout(() => {
            setDisplayedActivities(prev => updateNodeStatus(prev, pathParts, 'complete'));
          }, animationDuration);
        }

        setExpandedNodes(prev => Array.from(new Set([...prev, path])));

        currentIndex++;
        animationRef.current = requestAnimationFrame(() => {
          setTimeout(addNodesSequentially, animationDuration / 2);
        });
      };

      addNodesSequentially();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [activities, isInitialLoad, animationDuration, areTreesEqual, getNodesInOrder, addNodeToTree, updateNodeStatus, isLeafNode, hasAllChildren]);

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
        titles.push(node.name);
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
          path.push({ title: node.name, color: '#2196f3' });
          return true;
        }
        if (node.children && findPath(node.children, targetNode)) {
          path.unshift({ title: node.name, color: '#4caf50' });
          return true;
        }
      }
      return false;
    };
    
    findPath(activities, activities[0]);
    return path;
  }, [activities]);

  const handleNodeSelect = (node: TreeNode & { path: string }) => {
    setSelectedNode(node);
    onNodeSelect(node);
  };

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
            onNodeSelect={handleNodeSelect}
            selectedNode={selectedNode}
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
                    handleNodeSelect(node);
                    setMobileOpen(false);
                  }}
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
              onNodeSelect={handleNodeSelect}
              selectedNode={selectedNode}
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
