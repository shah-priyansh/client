import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from './input';
import { cn } from '../../lib/utils';

const SearchInput = ({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  loading = false,
  searching = false,
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <div className={cn("relative flex-1 max-w-full sm:max-w-md", className)}>
      <Search 
        className={cn(
          "absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5",
          searching ? 'text-blue-500 animate-pulse' : 'text-gray-400'
        )} 
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-20"
        disabled={disabled || loading}
        {...props}
      />
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
        {searching && (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        )}
        {value && !searching && onClear && (
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            type="button"
            disabled={disabled || loading}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
