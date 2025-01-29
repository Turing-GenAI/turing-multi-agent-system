import React from 'react';
import {
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip,
  Badge,
} from '@mui/material';
import ExpandAllIcon from '@mui/icons-material/UnfoldMore';
import CollapseAllIcon from '@mui/icons-material/UnfoldLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickActionsProps {
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onToggleSearch: () => void;
  onToggleFilters: () => void;
  showKeyboardShortcuts: () => void;
}

interface ActionItem {
  icon: JSX.Element;
  name: string;
  onClick: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  onExpandAll,
  onCollapseAll,
  onToggleSearch,
  onToggleFilters,
  showKeyboardShortcuts,
}) => {
  const [open, setOpen] = React.useState<boolean>(false);
  const [showTooltip, setShowTooltip] = React.useState<boolean>(false);

  const actions: ActionItem[] = [
    { icon: <ExpandAllIcon />, name: 'Expand All', onClick: onExpandAll },
    { icon: <CollapseAllIcon />, name: 'Collapse All', onClick: onCollapseAll },
    { icon: <SearchIcon />, name: 'Toggle Search', onClick: onToggleSearch },
    { icon: <FilterListIcon />, name: 'Toggle Filters', onClick: onToggleFilters },
    {
      icon: <KeyboardIcon />,
      name: 'Keyboard Shortcuts',
      onClick: showKeyboardShortcuts,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Badge
          color="primary"
          variant="dot"
          invisible={!open}
          sx={{
            '& .MuiBadge-badge': {
              right: 14,
              top: 14,
            },
          }}
        >
          <SpeedDial
            ariaLabel="Quick Actions"
            icon={<SpeedDialIcon />}
            onClose={() => {
              setOpen(false);
              setShowTooltip(false);
            }}
            onOpen={() => {
              setOpen(true);
              setShowTooltip(true);
            }}
            open={open}
            direction="up"
            sx={{
              '& .MuiSpeedDial-fab': {
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            }}
          >
            {actions.map((action) => (
              <SpeedDialAction
                key={action.name}
                icon={action.icon}
                tooltipTitle={
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {action.name}
                  </motion.div>
                }
                tooltipOpen={showTooltip}
                onClick={() => {
                  action.onClick();
                  setOpen(false);
                }}
              />
            ))}
          </SpeedDial>
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
};

export default QuickActions;
