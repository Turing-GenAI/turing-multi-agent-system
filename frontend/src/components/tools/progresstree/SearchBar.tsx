import React, { useState } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import { motion, AnimatePresence } from 'framer-motion';

type FilterType = 'Complete' | 'In Progress' | 'Pending';

interface SearchBarProps {
  onSearch: (term: string) => void;
  onFilter: (filters: FilterType[]) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, onFilter }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilters, setActiveFilters] = useState<FilterType[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const handleSearch = (value: string): void => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleAddFilter = (filter: FilterType): void => {
    if (!activeFilters.includes(filter)) {
      const newFilters = [...activeFilters, filter];
      setActiveFilters(newFilters);
      onFilter(newFilters);
    }
  };

  const handleRemoveFilter = (filter: FilterType): void => {
    const newFilters = activeFilters.filter(f => f !== filter);
    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const filters: FilterType[] = ['Complete', 'In Progress', 'Pending'];

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => handleSearch('')}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              borderRadius: 2,
              '&:hover': {
                bgcolor: 'background.paper',
              },
            },
          }}
        />
        <Tooltip title="Toggle filters">
          <IconButton
            size="small"
            onClick={() => setShowFilters(!showFilters)}
            sx={{ ml: 1 }}
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1,
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              {filters.map((filter) => (
                <Chip
                  key={filter}
                  label={filter}
                  size="small"
                  onClick={() => handleAddFilter(filter)}
                  onDelete={
                    activeFilters.includes(filter)
                      ? () => handleRemoveFilter(filter)
                      : undefined
                  }
                  color={activeFilters.includes(filter) ? 'primary' : 'default'}
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
                />
              ))}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SearchBar;
