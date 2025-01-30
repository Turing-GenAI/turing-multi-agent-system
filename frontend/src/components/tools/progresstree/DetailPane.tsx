import React from 'react';
import { Paper, Typography, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface TreeNode {
  name: string;
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

  const nodeColor = getNodeColor(selectedNode.name);

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
        {selectedNode.name}
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
            '&::-webkit-scrollbar': {
              width: '8px',
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.divider,
              borderRadius: '4px',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            },
          }}
        >
          <Box
            sx={{
              color: theme.palette.text.primary,
              fontFamily: '"Segoe UI", "Roboto", sans-serif',
              fontSize: '0.95rem',
              lineHeight: 1.8,
            }}
          >
            {selectedNode.content?.split('\n').map((paragraph, index, array) => {
              // Skip empty lines but preserve spacing
              if (!paragraph.trim()) {
                return <Box key={index} sx={{ height: '0.5rem' }} />;
              }

              // Check if line starts with bullet point
              const isBullet = paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-');
              
              // Check if line is a heading (starts with # or is in all caps)
              const isHeading = paragraph.trim().startsWith('#') || 
                             (paragraph.trim() === paragraph.trim().toUpperCase() && 
                              paragraph.trim().length > 3);

              // Check if this is a code block (indented by 4 spaces or tab)
              const isCodeBlock = paragraph.startsWith('    ') || paragraph.startsWith('\t');

              // Format code blocks (text between backticks)
              const formattedText = paragraph.split('`').map((part, i) => {
                if (i % 2 === 1) { // Text between backticks
                  return (
                    <Box
                      key={i}
                      component="code"
                      sx={{
                        backgroundColor: theme.palette.action.hover,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'Consolas, monospace',
                        fontSize: '0.9em',
                        color: theme.palette.primary.main,
                      }}
                    >
                      {part}
                    </Box>
                  );
                }
                // Check for bold text (between ** or __)
                return part.split(/(\*\*.*?\*\*|__.*?__)/g).map((text, j) => {
                  if (text.startsWith('**') || text.startsWith('__')) {
                    return (
                      <Box
                        key={`${i}-${j}`}
                        component="strong"
                        sx={{
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                        }}
                      >
                        {text.slice(2, -2)}
                      </Box>
                    );
                  }
                  return text;
                });
              });

              if (isHeading) {
                const headingText = paragraph.replace(/^#\s*/, '');
                return (
                  <Typography
                    key={index}
                    variant="h6"
                    sx={{
                      color: nodeColor,
                      fontWeight: 600,
                      mt: index === 0 ? 0 : 2.5,
                      mb: 1.5,
                      fontSize: '1.2rem',
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      pb: 0.5,
                    }}
                  >
                    {headingText}
                  </Typography>
                );
              }

              if (isCodeBlock) {
                return (
                  <Box
                    key={index}
                    sx={{
                      backgroundColor: theme.palette.action.hover,
                      borderRadius: '6px',
                      p: 2,
                      my: 1.5,
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.9em',
                      color: theme.palette.text.primary,
                      whiteSpace: 'pre-wrap',
                      overflowX: 'auto',
                    }}
                  >
                    {paragraph.replace(/^(\t|    )/, '')}
                  </Box>
                );
              }

              if (isBullet) {
                const bulletText = paragraph.replace(/^[•-]\s*/, '');
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      mt: 1,
                      ml: 2,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        color: theme.palette.primary.main,
                        mr: 1.5,
                        fontWeight: 'bold',
                        lineHeight: 1.8,
                      }}
                    >
                      •
                    </Box>
                    <Typography
                      sx={{
                        flex: 1,
                        '& code': {
                          backgroundColor: theme.palette.action.hover,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontFamily: 'Consolas, monospace',
                          fontSize: '0.9em',
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      {formattedText}
                    </Typography>
                  </Box>
                );
              }

              // Check if next line is a heading to add more space
              const nextIsHeading = array[index + 1]?.trim().startsWith('#') ||
                                 (array[index + 1]?.trim() === array[index + 1]?.trim().toUpperCase() &&
                                  array[index + 1]?.trim().length > 3);

              return (
                <Typography
                  key={index}
                  paragraph
                  sx={{
                    mt: index === 0 ? 0 : 1.5,
                    mb: nextIsHeading ? 2 : 0,
                    textAlign: 'justify',
                    hyphens: 'auto',
                    '& code': {
                      backgroundColor: theme.palette.action.hover,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'Consolas, monospace',
                      fontSize: '0.9em',
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {formattedText}
                </Typography>
              );
            })}
          </Box>
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
