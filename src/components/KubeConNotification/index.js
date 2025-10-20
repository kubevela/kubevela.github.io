import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';

function KubeConNotification() {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Hide notification after November 12, 2025 (KubeCon + CloudNativeCon Atlanta 2025)
    const endDate = new Date('2025-11-12');
    const currentDate = new Date();
    
    // Don't show if past the end date
    if (currentDate > endDate) {
      setIsVisible(false);
      return;
    }
    
    // Check if user has dismissed the notification within 24 hours
    const dismissedTime = localStorage.getItem('kubecon-cloudnativecon-atlanta-2025-notification-dismissed-time');
    if (dismissedTime) {
      const timeSinceDismissed = currentDate.getTime() - parseInt(dismissedTime);
      const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      
      if (timeSinceDismissed < twentyFourHours) {
        setIsVisible(false);
        return;
      } else {
        // Clear old dismissal after 24 hours
        localStorage.removeItem('kubecon-cloudnativecon-atlanta-2025-notification-dismissed-time');
      }
    }
    
    setIsVisible(true);
  }, []);
  
  const handleDismiss = () => {
    // Store dismissal time instead of just a flag
    localStorage.setItem('kubecon-cloudnativecon-atlanta-2025-notification-dismissed-time', Date.now().toString());
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.notificationBanner}>
      <div className={styles.notificationContent}>
        <img 
          src="/img/kccnc-na-2025-color.svg" 
          alt="KubeCon + CloudNativeCon North America 2025" 
          className={styles.conferenceLogo}
        />
        <div className={styles.messageContainer}>
          <span className={styles.message}>
            Attending KubeCon + CloudNativeCon Atlanta 2025?
            <br />
            Join KubeVela Maintainers <strong>Anoop Gopalakrishnan & Jerome Guionnet</strong>
          </span>
          <span className={styles.dateTime}>
            📅 November 12th, 4:00 PM EST
          </span>
          <span className={styles.title}>
            <strong>Component Contributor Architecture: Democratizing Platform Engineering With CNCF Projects</strong>
          </span>
          <span className={styles.description}>
            Learn how Guidewire uses KubeVela's Open Application Model alongside Crossplane to enable modular, contributor-driven platforms that eliminate bottlenecks while maintaining governance.
          </span>
        </div>
        <a 
          href="https://kccncna2025.sched.com/event/27Fb4/component-contributor-architecture-democratizing-platform-engineering-with-cncf-projects-anoop-gopalakrishnan-jerome-guionnet-guidewire?iframe=yes&w=100%&sidebar=yes&bg=no" 
          className={styles.ctaButton}
          target="_blank"
          rel="noopener noreferrer"
        >
          View Session →
        </a>
        <button 
          onClick={handleDismiss} 
          className={styles.closeButton}
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default KubeConNotification;