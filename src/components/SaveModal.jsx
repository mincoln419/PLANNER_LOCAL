import React, { useEffect, useState, useRef } from 'react';
import './SaveModal.css';

function SaveModal({ show, onClose }) {
  const [visible, setVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const timersRef = useRef({ fadeOut: null, close: null });

  const closeModal = () => {
    // 모든 타이머 클리어
    if (timersRef.current.fadeOut) {
      clearTimeout(timersRef.current.fadeOut);
    }
    if (timersRef.current.close) {
      clearTimeout(timersRef.current.close);
    }
    
    setIsClosing(true);
    // 페이드아웃 애니메이션 후 완전히 닫기
    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 300);
  };

  useEffect(() => {
    if (show) {
      // 현재 스크롤 위치 저장
      const scrollPosition = window.scrollY || window.pageYOffset;
      
      setVisible(true);
      setIsClosing(false);
      
      // 포커스로 인한 스크롤 방지: 현재 포커스된 요소 저장
      const activeElement = document.activeElement;
      
      // 1초 후 페이드아웃 시작
      timersRef.current.fadeOut = setTimeout(() => {
        setIsClosing(true);
      }, 1000);
      
      // 페이드아웃 애니메이션 후 완전히 닫기
      timersRef.current.close = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 1300); // 1초 표시 + 0.3초 페이드아웃
      
      // 키보드 입력 감지하여 즉시 닫기
      const handleKeyDown = () => {
        closeModal();
      };
      
      window.addEventListener('keydown', handleKeyDown);
      
      // 포커스로 인한 스크롤 방지
      requestAnimationFrame(() => {
        if (activeElement && activeElement !== document.body) {
          activeElement.focus({ preventScroll: true });
        }
        window.scrollTo(0, scrollPosition);
      });
      
      return () => {
        if (timersRef.current.fadeOut) {
          clearTimeout(timersRef.current.fadeOut);
        }
        if (timersRef.current.close) {
          clearTimeout(timersRef.current.close);
        }
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      setVisible(false);
      setIsClosing(false);
    }
  }, [show, onClose]);

  if (!visible) return null;

  return (
    <div 
      className={`save-modal-overlay ${isClosing ? 'fade-out' : ''}`}
      onClick={closeModal}
      tabIndex={-1}
      onFocus={(e) => e.target.blur()}
    >
      <div 
        className={`save-modal-content ${isClosing ? 'fade-out' : ''}`}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        onFocus={(e) => e.target.blur()}
      >
        <div className="save-modal-icon">✓</div>
        <div className="save-modal-message">저장되었습니다</div>
      </div>
    </div>
  );
}

export default SaveModal;
