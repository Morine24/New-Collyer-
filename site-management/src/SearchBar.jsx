
import React from 'react';
import { FaSearch } from 'react-icons/fa';

export default function SearchBar({ searchQuery, setSearchQuery, placeholder }) {
  return (
    <div className="search-bar">
      <FaSearch className="search-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
      />
    </div>
  );
}
