import { useState, useRef, useEffect } from 'react';
import { useBranchSelector } from '../../hooks/useBranches';
import type { Branch } from '../../types/branch.types';

interface BranchSelectorProps {
    value: string | null;
    onChange: (branchId: string | null) => void;
    placeholder?: string;
    showAllOption?: boolean;
    allOptionLabel?: string;
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * BranchSelector - A dropdown component for selecting a branch
 * Used throughout the app for filtering data by branch
 */
export function BranchSelector({
    value,
    onChange,
    placeholder = 'Select Branch',
    showAllOption = true,
    allOptionLabel = 'All Branches',
    disabled = false,
    className = '',
    size = 'md',
}: BranchSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { branches, isLoading } = useBranchSelector();

    const selectedBranch = branches.find((b) => b.id === value);

    // Filter branches based on search
    const filteredBranches = branches.filter(
        (b) =>
            b.name.toLowerCase().includes(search.toLowerCase()) ||
            b.code.toLowerCase().includes(search.toLowerCase()) ||
            (b.address?.city?.toLowerCase().includes(search.toLowerCase()))
    );

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (branchId: string | null) => {
        onChange(branchId);
        setIsOpen(false);
        setSearch('');
    };

    const sizeClasses = {
        sm: 'px-2 py-1 text-sm',
        md: 'px-3 py-2 text-base',
        lg: 'px-4 py-3 text-lg',
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${sizeClasses[size]}`}
            >
                <span className="flex items-center">
                    <span className="text-lg mr-2">🏢</span>
                    {isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                    ) : selectedBranch ? (
                        <span>
                            <span className="font-medium">{selectedBranch.name}</span>
                            <span className="text-gray-500 ml-1">({selectedBranch.code})</span>
                        </span>
                    ) : value === null && showAllOption ? (
                        <span className="text-gray-700">{allOptionLabel}</span>
                    ) : (
                        <span className="text-gray-400">{placeholder}</span>
                    )}
                </span>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search branches..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            autoFocus
                        />
                    </div>

                    {/* Options */}
                    <div className="max-h-60 overflow-y-auto">
                        {/* All Branches Option */}
                        {showAllOption && (
                            <button
                                type="button"
                                onClick={() => handleSelect(null)}
                                className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center ${
                                    value === null ? 'bg-primary-50 text-primary-700' : ''
                                }`}
                            >
                                <span className="text-lg mr-2">🌐</span>
                                <span className="font-medium">{allOptionLabel}</span>
                            </button>
                        )}

                        {/* Branch List */}
                        {filteredBranches.length === 0 ? (
                            <div className="px-4 py-3 text-gray-500 text-sm text-center">
                                No branches found
                            </div>
                        ) : (
                            filteredBranches.map((branch) => (
                                <BranchOption
                                    key={branch.id}
                                    branch={branch}
                                    isSelected={branch.id === value}
                                    onSelect={() => handleSelect(branch.id)}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function BranchOption({
    branch,
    isSelected,
    onSelect,
}: {
    branch: Branch;
    isSelected: boolean;
    onSelect: () => void;
}) {
    const typeIcons: Record<string, string> = {
        HEAD_OFFICE: '🏛️',
        REGIONAL_OFFICE: '🏢',
        OFFICE: '🏪',
        WAREHOUSE: '📦',
        OPERATIONAL_BASE: '⛺',
    };

    return (
        <button
            type="button"
            onClick={onSelect}
            className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between ${
                isSelected ? 'bg-primary-50 text-primary-700' : ''
            }`}
        >
            <div className="flex items-center">
                <span className="text-lg mr-2">{typeIcons[branch.type] || '🏢'}</span>
                <div>
                    <div className="font-medium">{branch.name}</div>
                    <div className="text-xs text-gray-500">
                        {branch.code}
                        {branch.address?.city && ` • ${branch.address.city}`}
                    </div>
                </div>
            </div>
            {isSelected && (
                <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                </svg>
            )}
        </button>
    );
}

// ============================================================================
// Compact Branch Badge
// ============================================================================

interface BranchBadgeProps {
    branch: Branch | null;
    size?: 'sm' | 'md';
    className?: string;
}

export function BranchBadge({ branch, size = 'md', className = '' }: BranchBadgeProps) {
    if (!branch) {
        return (
            <span className={`inline-flex items-center text-gray-500 ${className}`}>
                <span className="text-sm mr-1">🌐</span>
                <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>All Branches</span>
            </span>
        );
    }

    const typeColors: Record<string, string> = {
        HEAD_OFFICE: 'bg-purple-100 text-purple-800',
        REGIONAL_OFFICE: 'bg-blue-100 text-blue-800',
        OFFICE: 'bg-gray-100 text-gray-800',
        WAREHOUSE: 'bg-yellow-100 text-yellow-800',
        OPERATIONAL_BASE: 'bg-green-100 text-green-800',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full ${typeColors[branch.type] || typeColors.OFFICE} ${
                size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
            } ${className}`}
        >
            <span className="font-medium">{branch.code}</span>
        </span>
    );
}

// ============================================================================
// Branch Filter Bar
// ============================================================================

interface BranchFilterBarProps {
    value: string | null;
    onChange: (branchId: string | null) => void;
    label?: string;
}

export function BranchFilterBar({ value, onChange, label = 'Filter by Branch' }: BranchFilterBarProps) {
    return (
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-600">{label}:</span>
            <BranchSelector
                value={value}
                onChange={onChange}
                size="sm"
                className="min-w-[200px]"
            />
            {value && (
                <button
                    onClick={() => onChange(null)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Clear filter"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
}

export default BranchSelector;
