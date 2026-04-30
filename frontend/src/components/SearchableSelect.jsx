import React, { useState, useEffect, useRef } from 'react';

const SearchableSelect = ({ options, value, onChange, placeholder = "Seleccionar...", labelKey = "label", valueKey = "value" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);
    const wrapperRef = useRef(null);

    useEffect(() => {
        setFilteredOptions(
            options.filter(option => 
                option[labelKey].toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [searchTerm, options, labelKey]);

    useEffect(() => {
        // Handle clicking outside to close
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
        setSearchTerm('');
    };

    // Find current selected label
    const selectedOption = options.find(o => o[valueKey] == value); // Loose equality for string/number match
    const displayText = selectedOption ? selectedOption[labelKey] : placeholder;

    return (
        <div className="relative" ref={wrapperRef}>
            <div 
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white cursor-pointer flex justify-between items-center focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${!selectedOption ? 'text-gray-500' : 'text-gray-900'}`}>
                    {displayText}
                </span>
                <span className="ml-2 text-gray-400">▼</span>
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:border-indigo-500"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                    {filteredOptions.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">No se encontraron resultados</div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option[valueKey]}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 text-gray-900`}
                                onClick={() => handleSelect(option)}
                            >
                                <span className={`block truncate ${option[valueKey] == value ? 'font-semibold' : 'font-normal'}`}>
                                    {option[labelKey]}
                                </span>
                                {option[valueKey] == value && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                        ✓
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
