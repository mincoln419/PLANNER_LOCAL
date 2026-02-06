import React, { useEffect } from 'react';
import './Snackbar.css';

function Snackbar({ message, show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="snackbar">
      <div className="snackbar-content">
        <span className="snackbar-message">{message}</span>
      </div>
    </div>
  );
}

export default Snackbar;
