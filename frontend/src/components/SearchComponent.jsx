import { useState, useEffect, useRef } from 'react';
import { Search } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDebounce } from '../hooks/useDebounce';
import { Command } from "cmdk";

const SearchComponent = () => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);
    const navigate = useNavigate();
    const inputRef = useRef(null);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                console.log('Fetching suggestions for:', debouncedQuery);
                const response = await axios.get(`/products/suggestions?q=${encodeURIComponent(debouncedQuery)}`);
                console.log('Suggestions response:', response.data);
                // Ensure suggestions is always an array
                setSuggestions(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
                setSuggestions([]);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    const handleSearch = (searchQuery = query) => {
        if (searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsOpen(false);
            setQuery('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleClickOutside = () => {
        setIsOpen(false);
    };

    return (
        <div className="relative w-full max-w-2xl">
            <div className="flex w-full">
                <Command className="relative w-full" shouldFilter={false}>
                    <div className="flex w-full items-center border border-gray-200 rounded-l-md bg-gray-50 overflow-hidden">
                        <Command.Input
                            ref={inputRef}
                            value={query}
                            onValueChange={setQuery}
                            onKeyDown={handleKeyDown}
                            placeholder="Search products..."
                            className="w-full px-4 py-2.5 text-sm bg-transparent focus:outline-none"
                            onFocus={() => setIsOpen(true)}
                            onBlur={() => setTimeout(handleClickOutside, 200)}
                        />
                    </div>

                    {isOpen && suggestions.length > 0 && (
                        <div className="absolute top-full w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 overflow-hidden z-50">
                            <Command.List className="max-h-[300px] overflow-y-auto p-2">
                                {suggestions.map((suggestion, index) => (
                                    <Command.Item
                                        key={index}
                                        value={suggestion.text}
                                        onSelect={() => handleSearch(suggestion.text)}
                                        className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer rounded"
                                    >
                                        <Search className="w-4 h-4 mr-2 text-gray-500" />
                                        <div>
                                            <div>{suggestion.text}</div>
                                            {suggestion.category && (
                                                <div className="text-xs text-gray-500">
                                                    in {suggestion.category}
                                                </div>
                                            )}
                                        </div>
                                    </Command.Item>
                                ))}
                            </Command.List>
                        </div>
                    )}
                </Command>
                <button
                    onClick={() => handleSearch()}
                    className="px-8 bg-[#062a51] text-white rounded-r-md hover:bg-[#062a51]/90 transition-colors flex items-center justify-center"
                >
                    <Search size={20} strokeWidth={2} />
                </button>
            </div>
        </div>
    );
}

export default SearchComponent;
