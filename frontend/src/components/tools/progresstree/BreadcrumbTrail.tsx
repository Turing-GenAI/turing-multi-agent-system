import React from 'react';
import { Box, Typography, Breadcrumbs } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { motion } from 'framer-motion';

interface PathNode {
  title: string;
  color?: string;
}

interface BreadcrumbTrailProps {
  path: PathNode[];
}

const BreadcrumbTrail: React.FC<BreadcrumbTrailProps> = ({ path }) => {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      sx={{ mb: 3 }}
    >
      <Breadcrumbs
        separator={
          <NavigateNextIcon
            sx={{
              fontSize: '1.2rem',
              color: 'text.secondary',
            }}
          />
        }
      >
        {path.map((node, index) => (
          <Typography
            key={node.title}
            variant="body2"
            sx={{
              color: node.color || 'text.primary',
              fontWeight: index === path.length - 1 ? 600 : 400,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              '&:hover': {
                color: node.color ? `${node.color}dd` : 'text.primary',
              },
            }}
          >
            {node.title}
          </Typography>
        ))}
      </Breadcrumbs>
    </Box>
  );
};

export default BreadcrumbTrail;
