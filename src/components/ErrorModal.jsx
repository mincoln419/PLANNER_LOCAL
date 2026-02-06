import React, { useEffect } from 'react';
import './ErrorModal.css';

function ErrorModal({ message, show, onClose }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // 3초 후 자동으로 사라짐
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="error-modal-overlay" onClick={onClose}>
      <div className="error-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="error-modal-icon">✕</div>
        <div className="error-modal-message">{message}</div>
      </div>
    </div>
  );
}

export default ErrorModal;
