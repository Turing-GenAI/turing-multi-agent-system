import { useEffect, useCallback } from 'react';

interface TreeNode {
  title: string;
  children?: TreeNode[];
  parent?: TreeNode | null;
}

interface EnhancedTreeNode extends TreeNode {
  parent: TreeNode | null;
}

interface KeyboardNavigationProps {
  data: TreeNode[];
  selectedNode: TreeNode | null;
  onNodeSelect: (node: TreeNode) => void;
  onToggleExpand: (title: string) => void;
}

type NavigationDirection = 'up' | 'down' | 'left' | 'right';

const findNextNode = (
  data: TreeNode[],
  currentNode: TreeNode,
  direction: NavigationDirection
): TreeNode | null => {
  const flattenTree = (nodes: TreeNode[], parent: TreeNode | null = null): EnhancedTreeNode[] => {
    return nodes.reduce<EnhancedTreeNode[]>((acc, node) => {
      const current: EnhancedTreeNode = { ...node, parent };
      acc.push(current);
      if (node.children) {
        acc.push(...flattenTree(node.children, current));
      }
      return acc;
    }, []);
  };

  const flatNodes = flattenTree(data);
  const currentIndex = flatNodes.findIndex(node => node.title === currentNode.title);
  
  switch (direction) {
    case 'up': {
      const prevIndex = currentIndex - 1;
      return prevIndex >= 0 ? flatNodes[prevIndex] : null;
    }
    case 'down': {
      const nextIndex = currentIndex + 1;
      return nextIndex < flatNodes.length ? flatNodes[nextIndex] : null;
    }
    case 'left': {
      const current = flatNodes[currentIndex];
      return current.parent;
    }
    case 'right': {
      const current = flatNodes[currentIndex];
      if (current.children && current.children.length > 0) {
        return current.children[0];
      }
      return null;
    }
    default:
      return null;
  }
};

const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  data,
  selectedNode,
  onNodeSelect,
  onToggleExpand
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!selectedNode) return;

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        const prevNode = findNextNode(data, selectedNode, 'up');
        if (prevNode) onNodeSelect(prevNode);
        break;

      case 'ArrowDown':
        e.preventDefault();
        const nextNode = findNextNode(data, selectedNode, 'down');
        if (nextNode) onNodeSelect(nextNode);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        const parentNode = findNextNode(data, selectedNode, 'left');
        if (parentNode) {
          onNodeSelect(parentNode);
          onToggleExpand(parentNode.title);
        }
        break;

      case 'ArrowRight':
        e.preventDefault();
        const childNode = findNextNode(data, selectedNode, 'right');
        if (childNode) {
          onNodeSelect(childNode);
          onToggleExpand(selectedNode.title);
        }
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedNode.children) {
          onToggleExpand(selectedNode.title);
        }
        break;

      default:
        break;
    }
  }, [data, selectedNode, onNodeSelect, onToggleExpand]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null; // This is a behavior-only component
};

export default KeyboardNavigation;
