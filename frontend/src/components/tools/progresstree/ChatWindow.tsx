import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, TextField, IconButton, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MainLayout from './MainLayout';
import DetailPane from './DetailPane';
import BreadcrumbTrail from './BreadcrumbTrail';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';

interface TreeNode {
  title: string;
  children?: TreeNode[];
  summary?: string;
  content?: string;
}

interface Message {
  type: 'user' | 'system';
  content: string;
  tool?: 'TreePane';
}

interface PathNode {
  title: string;
  color: string;
}

// Custom resize handle component
const ResizeHandle: React.FC = () => {
  return (
    <PanelResizeHandle
      className="resize-handle"
      style={{
        width: '4px',
        background: 'transparent',
        position: 'relative',
        cursor: 'col-resize',
        '&:hover': {
          '&::after': {
            opacity: 0.6,
          },
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '4px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '2px',
          opacity: 0,
          transition: 'opacity 0.2s ease',
        },
      }}
    />
  );
};

const ChatWindow: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'system',
      content: 'Welcome! I will demonstrate the tree building process.',
      tool: 'TreePane'
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [nodePath, setNodePath] = useState<PathNode[]>([]);
  const [savedLayout, setSavedLayout] = useState<[number, number]>([70, 30]);

  const scrollToBottom = () => {
    if (shouldAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;
      setShouldAutoScroll(isAtBottom);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages(prev => [...prev, 
        { type: 'user', content: input },
        { type: 'system', content: 'Here is the tree visualization:', tool: 'TreePane' }
      ]);
      setInput('');
      setShouldAutoScroll(true); // Enable auto-scroll when sending a new message
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNodeSelect = (node: TreeNode) => {
    setSelectedNode(node);
    // Update path for breadcrumb
    if (node) {
      setNodePath([{ title: node.title, color: '#2196f3' }]);
    } else {
      setNodePath([]);
    }
  };

  const handleLayoutChange = (sizes: number[]) => {
    setSavedLayout([sizes[0], sizes[1]]);
  };

  return (
    <Box sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'grey.100'
    }}>
      <PanelGroup direction="horizontal" onLayout={handleLayoutChange}>
        <Panel defaultSize={savedLayout[0]}>
          {/* Messages Area */}
          <Box sx={{ 
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <Box
              ref={messagesContainerRef}
              onScroll={handleScroll}
              sx={{ 
                flex: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '80%',
                      bgcolor: message.type === 'user' ? 'primary.main' : 'background.paper',
                      color: message.type === 'user' ? 'white' : 'text.primary',
                      borderRadius: 2,
                      boxShadow: 2,
                    }}
                  >
                    <Typography>
                      {message.content}
                    </Typography>
                    {message.tool === 'TreePane' && (
                      <Box sx={{ mt: 2 }}>
                        <MainLayout onNodeSelect={handleNodeSelect} />
                      </Box>
                    )}
                  </Paper>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Box sx={{ 
                display: 'flex',
                gap: 1,
                alignItems: 'center'
              }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
                <IconButton 
                  onClick={handleSend}
                  color="primary"
                  sx={{ 
                    p: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </Panel>

        <ResizeHandle />

        <Panel defaultSize={savedLayout[1]} minSize={20}>
          <Box
            component={motion.main}
            layout
            sx={{
              height: '100%',
              overflow: 'auto',
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 3,
              m: 1,
              p: 3,
            }}
          >
            <AnimatePresence mode="wait">
              {nodePath.length > 0 && (
                <BreadcrumbTrail path={nodePath} />
              )}
              <DetailPane selectedNode={selectedNode} />
            </AnimatePresence>
          </Box>
        </Panel>
      </PanelGroup>
    </Box>
  );
};

export default ChatWindow;
