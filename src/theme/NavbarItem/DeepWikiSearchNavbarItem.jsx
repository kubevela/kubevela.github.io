import React, {useState, useRef, useEffect} from 'react';
import clsx from 'clsx';
import styles from './DeepWikiSearchNavbarItem.module.css';

export default function DeepWikiSearchNavbarItem() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleAlgoliaClick = () => {
    setIsOpen(false);
    // Trigger Algolia search - this simulates clicking the search button
    const searchButton = document.querySelector('.DocSearch-Button');
    if (searchButton) {
      searchButton.click();
    }
  };

  const handleDeepWikiClick = () => {
    setIsOpen(false);
    window.open('https://deepwiki.com/kubevela/kubevela', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={clsx('navbar__item', styles.searchDropdownContainer)} ref={dropdownRef}>
      <button
        className={clsx('navbar__link', styles.searchButton)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Search options"
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2"/>
          <path d="M15 15l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className={styles.searchLabel}>Search</span>
        <svg className={styles.chevron} width="12" height="12" viewBox="0 0 12 12">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.searchDropdown}>
          <button
            className={styles.searchOption}
            onClick={handleAlgoliaClick}
          >
            <div className={styles.searchOptionContent}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16z" stroke="currentColor" strokeWidth="2"/>
                <path d="M15 15l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div className={styles.searchOptionText}>
                <div className={styles.searchOptionTitle}>Algolia Search</div>
                <div className={styles.searchOptionDescription}>Traditional keyword search</div>
              </div>
            </div>
          </button>

          <button
            className={styles.searchOption}
            onClick={handleDeepWikiClick}
          >
            <div className={styles.searchOptionContent}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
              </svg>
              <div className={styles.searchOptionText}>
                <div className={styles.searchOptionTitle}>DeepWiki AI</div>
                <div className={styles.searchOptionDescription}>AI-powered documentation search</div>
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
