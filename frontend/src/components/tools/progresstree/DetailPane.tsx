import React from 'react';
import { Paper, Typography, Box, useTheme, Button, CircularProgress, Badge } from '@mui/material';
import { motion } from 'framer-motion';
import { getAgentDisplayNameByNode } from '../../../data/agentNames';
import { Database } from 'lucide-react';

interface TreeNode {
  name: string;
  content?: string;
  children?: TreeNode[];
}

interface DetailPaneProps {
  selectedNode: TreeNode | null;
  onRetrievedContextClick?: () => void;
  hasRetrievedContext?: boolean;
  isContextLoading?: boolean;
  retrievedContextCount?: number;
}

const decodeSpecialChars = (text: string): string => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const DetailPane: React.FC<DetailPaneProps> = ({ 
  selectedNode, 
  onRetrievedContextClick,
  hasRetrievedContext = false,
  isContextLoading = false,
  retrievedContextCount = 0
}) => {
  const theme = useTheme();

  // Return empty div for any Unknown node to prevent details from showing
  if (selectedNode?.name === 'Unknown') {
    return <div></div>;
  }

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
          {/* Select an activity from the tree */}
          {/* <span>Choose any node to view its details</span> */}
        </Typography>
      </Paper>
    );
  }

  const getNodeColor = (nodeName: string): string => {
    if (nodeName.includes('critique_agent')) return theme.palette.warning.dark
    if (nodeName.includes('reflection_agent')) return theme.palette.success.dark
    if (nodeName.includes('feedback_agent')) return theme.palette.info.dark
    if (nodeName.includes('Unknown')) return theme.palette.grey[700]
    return theme.palette.primary.main
  };

  const getNodeBackground = (nodeName: string): string => {
    if (nodeName.includes('critique_agent')) return 'rgba(254, 243, 199, 0.3)' // Light yellow
    if (nodeName.includes('reflection_agent')) return 'rgba(209, 250, 229, 0.3)' // Light green
    if (nodeName.includes('feedback_agent')) return 'rgba(219, 234, 254, 0.3)' // Light blue
    if (nodeName.includes('Unknown')) return 'rgba(243, 244, 246, 0.5)' // Light gray
    return theme.palette.background.paper
  };

  const nodeColor = getNodeColor(selectedNode.name);
  const nodeBackground = getNodeBackground(selectedNode.name);

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      elevation={0}
      sx={{
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: nodeBackground,
        borderRadius: 2,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(90deg, ${nodeColor}, ${theme.palette.background.paper})`,
        }
      }}
    >
      <Box sx={{ p: 3, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            color: nodeColor,
            position: 'relative',
            display: 'inline-block',
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
          {getAgentDisplayNameByNode(selectedNode.name)}
        </Typography>

        {/* Retrieved Context button only for Self RAG nodes */}
        {getAgentDisplayNameByNode(selectedNode.name) === "Self RAG" && onRetrievedContextClick && (
          <Button
            variant="contained"
            size="small"
            onClick={onRetrievedContextClick}
            disabled={!hasRetrievedContext || isContextLoading}
            startIcon={isContextLoading ? <CircularProgress size={16} color="inherit" /> : <Database size={16} />}
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              color: 'rgb(59, 130, 246)',
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              py: 0.75,
              fontSize: '0.8rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(59, 130, 246, 0.2)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(229, 231, 235, 0.2)',
                color: 'rgba(156, 163, 175, 0.7)',
                border: '1px solid rgba(229, 231, 235, 0.5)',
              },
              position: 'relative'
            }}
          >
            Retrieved Context
            {retrievedContextCount > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  backgroundColor: theme.palette.primary.main,
                  color: '#fff',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  border: '2px solid white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                {retrievedContextCount}
              </Box>
            )}
          </Button>
        )}
      </Box>

      <Box sx={{ 
        flex: 1,
        minHeight: 0,
        px: 3,
        pb: 3,
        overflow: 'auto'
      }}>
        {selectedNode.content ? (
          <Paper
            elevation={0}
            sx={{
              p: 3,
              bgcolor: nodeBackground,
              border: '1px solid',
              borderColor: theme.palette.divider,
              borderRadius: 2,
              height: '100%',
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
                // Decode special characters in the paragraph
                const decodedParagraph = decodeSpecialChars(paragraph);
                
                // Skip empty lines but preserve spacing
                if (!decodedParagraph.trim()) {
                  return <Box key={index} sx={{ height: '0.5rem' }} />;
                }

                // Check if line starts with bullet point (including encoded bullets)
                const isBullet = decodedParagraph.trim().startsWith('•') || 
                               decodedParagraph.trim().startsWith('-') ||
                               decodedParagraph.trim().startsWith('\u00e2\u20ac\u00a2'); // encoded bullet
                
                // Check if line is a heading (starts with # or is in all caps)
                const isHeading = decodedParagraph.trim().startsWith('#') || 
                               (decodedParagraph.trim() === decodedParagraph.trim().toUpperCase() && 
                                decodedParagraph.trim().length > 3);

                // Check if this is a code block (indented by 4 spaces or tab)
                const isCodeBlock = decodedParagraph.startsWith('    ') || decodedParagraph.startsWith('\t');

                // Format code blocks (text between backticks)
                const formattedText = decodedParagraph.split('`').map((part, i) => {
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
                  const headingText = decodedParagraph.replace(/^#\s*/, '');
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
                        borderBottom: `1px solid ${nodeColor}`,
                        pb: 0.5,
                        opacity: 0.9
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
                      {decodedParagraph.replace(/^(\t|    )/, '')}
                    </Box>
                  );
                }

                if (isBullet) {
                  const bulletText = decodedParagraph.replace(/^[•\u00e2\u20ac\u00a2-]\s*/, '');
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
                          color: nodeColor,
                          mr: 1.5,
                          fontWeight: 'bold',
                          lineHeight: 1.8,
                          opacity: 0.9
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
                opacity: 0.9
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
      </Box>
    </Paper>
  );
};

export default DetailPane;
