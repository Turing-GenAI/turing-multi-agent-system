import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface TreeNode {
  title: string;
  content?: string;
  children?: TreeNode[];
}

interface DetailPaneProps {
  selectedNode: TreeNode | null;
}

const DetailPane: React.FC<DetailPaneProps> = ({ selectedNode }) => {
  const theme = useTheme();

  if (!selectedNode) {
    return (
      <Paper 
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        elevation={0}
        className="gradient-border"
        sx={{ 
          p: 4, 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          background: `linear-gradient(135deg, 
            ${theme.palette.background.paper} 0%, 
            ${theme.palette.background.default} 100%)`,
          backdropFilter: 'blur(8px)',
          borderRadius: 2,
          boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography 
          component={motion.div}
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          color="text.secondary"
          sx={{
            fontSize: '1.1rem',
            letterSpacing: '0.02em',
            fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
            textAlign: 'center',
            '& span': {
              display: 'block',
              fontSize: '0.9rem',
              mt: 1.5,
              opacity: 0.7,
              color: theme.palette.primary.main,
            }
          }}
        >
          Select an activity from the tree
          <span>Choose any node to view its details</span>
        </Typography>
      </Paper>
    );
  }

  const getNodeColor = (title: string): string => {
    const colors = [
      '#2196f3', // blue
      '#4caf50', // green
      '#ff9800', // orange
      '#9c27b0', // purple
      '#f44336', // red
    ];
    return colors[Math.abs(title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length];
  };

  const nodeColor = getNodeColor(selectedNode.title);

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      elevation={0}
      sx={{
        height: '100%',
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        overflow: 'auto',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        }
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: nodeColor,
          position: 'relative',
          display: 'inline-block',
          mb: 3,
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -4,
            left: 0,
            width: '2em',
            height: '2px',
            backgroundColor: nodeColor,
            opacity: 0.5,
          }
        }}
      >
        {selectedNode.title}
      </Typography>

      {selectedNode.content ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            height: 'calc(100% - 80px)',
            bgcolor: theme.palette.background.paper,
            border: '1px solid',
            borderColor: theme.palette.divider,
            borderRadius: 2,
            overflow: 'auto',
          }}
        >
          <Typography
            variant="body2"
            component="pre"
            sx={{
              color: theme.palette.text.primary,
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {selectedNode.content}
          </Typography>
        </Paper>
      ) : (
        <Typography
          color="text.secondary"
          sx={{
            fontSize: '0.95rem',
            letterSpacing: '0.01em',
            lineHeight: 1.6,
            opacity: 0.9,
            '& span': {
              color: nodeColor,
              fontWeight: 500,
            }
          }}
        >
          {!selectedNode.children ? (
            'This node has no content to display.'
          ) : (
            <>
              This is a parent node with <span>{selectedNode.children?.length || 0} sub-activities</span>.
              Select a sub-activity to view its details.
            </>
          )}
        </Typography>
      )}
    </Paper>
  );
};

export default DetailPane;
