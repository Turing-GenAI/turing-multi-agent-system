import React from 'react';
import { Box, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PendingIcon from '@mui/icons-material/PendingActions';
import { SvgIconComponent } from '@mui/icons-material';

type StatusType = 'complete' | 'in progress' | 'pending';

interface StatusConfig {
  color: string;
  icon: SvgIconComponent;
  label: string;
  animation: {
    scale: number[];
    rotate: number[];
  };
}

interface NodeStatusProps {
  status: StatusType;
}

const statusConfig: Record<StatusType, StatusConfig> = {
  complete: {
    color: '#4caf50',
    icon: CheckCircleIcon,
    label: 'Complete',
    animation: {
      scale: [1, 1.2, 1],
      rotate: [0, 0, 0],
    },
  },
  'in progress': {
    color: '#2196f3',
    icon: AutorenewIcon,
    label: 'In Progress',
    animation: {
      scale: [1, 1.1, 1],
      rotate: [0, 360, 720],
    },
  },
  pending: {
    color: '#ff9800',
    icon: PendingIcon,
    label: 'Pending',
    animation: {
      scale: [1, 1.1, 1],
      rotate: [0, -10, 10, -10, 0],
    },
  },
};

const NodeStatus: React.FC<NodeStatusProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  const IconComponent = config.icon;

  return (
    <Tooltip 
      title={config.label}
      placement="right"
      arrow
    >
      <Box
        sx={{
          position: 'relative',
          width: 16,
          height: 16,
          mr: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Glowing background effect */}
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            bgcolor: config.color,
            opacity: 0.15,
            animation: status === 'in progress' ? 'pulse 2s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { transform: 'scale(1)', opacity: 0.15 },
              '50%': { transform: 'scale(1.5)', opacity: 0.25 },
              '100%': { transform: 'scale(1)', opacity: 0.15 },
            },
          }}
        />
        
        {/* Main dot with icon */}
        <Box
          component={motion.div}
          animate={config.animation}
          transition={{
            duration: status === 'in progress' ? 3 : 0.4,
            repeat: status === 'in progress' ? Infinity : 0,
            ease: status === 'in progress' ? 'linear' : 'easeInOut',
          }}
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            bgcolor: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 6px ${config.color}80`,
            border: '2px solid',
            borderColor: 'background.paper',
          }}
        >
          <IconComponent 
            sx={{ 
              fontSize: '0.75rem',
              color: 'background.paper',
            }}
          />
        </Box>
      </Box>
    </Tooltip>
  );
};

export default NodeStatus;
