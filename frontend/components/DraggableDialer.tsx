'use client';

import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import { Phone, X, Minimize2, Maximize2 } from 'lucide-react';

interface DraggableDialerProps {
  isOpen: boolean;
  phoneNumber?: string;
  metadata?: any;
  onClose: () => void;
  isInCall?: boolean;
  onCallStateChange?: (inCall: boolean) => void;
}

export default function DraggableDialer({ isOpen, phoneNumber, metadata, onClose, isInCall, onCallStateChange }: DraggableDialerProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState({ width: 350, height: 500 });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const nodeRef = useRef(null);

  console.log('DraggableDialer render:', { isOpen, phoneNumber, metadata });

  // Reset loading state when phone number changes (iframe will reload)
  useEffect(() => {
    if (phoneNumber && !isInCall) { // Only reload if not in a call
      setIsLoading(true);
      setHasError(false);
    }
  }, [phoneNumber, metadata, isInCall]);

  if (!isOpen) {
    return null;
  }

  const dialerUrl = phoneNumber 
    ? metadata
      ? `https://app.justcall.io/dialer?numbers=${encodeURIComponent(phoneNumber)}&medium=custom&metadata=${encodeURIComponent(JSON.stringify(metadata))}&metadata_type=json`
      : `https://app.justcall.io/dialer?numbers=${encodeURIComponent(phoneNumber)}`
    : 'https://app.justcall.io/dialer';

  return (
    <Draggable
      nodeRef={nodeRef}
      handle=".dialer-handle"
      defaultPosition={{ x: 50, y: 50 }}
      bounds="parent"
    >
      <div
        ref={nodeRef}
        className={`fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden ${
          isMinimized ? 'h-12' : ''
        }`}
        style={{
          width: isMinimized ? 280 : size.width,
          height: isMinimized ? 48 : size.height,
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          backgroundColor: 'white',
          position: 'fixed',
          top: '50px',
          left: '50px',
          transform: 'scale(0.75)',
          transformOrigin: 'top left',
        }}
      >
        {/* Header */}
        <div className={`dialer-handle ${isInCall ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'} text-white p-3 cursor-move flex items-center justify-between`}>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4" />
            <div>
              <h3 className="font-semibold text-sm flex items-center space-x-2">
                JustCall Dialer
                {isInCall && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-400 text-green-900 animate-pulse">
                    📞 In Call
                  </span>
                )}
              </h3>
              {!isMinimized && phoneNumber && (
                <p className="text-blue-100 text-xs">
                  {phoneNumber}
                  {metadata && ` • ${metadata.lead_name}`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white/80 hover:text-white transition-colors p-1"
              title={isMinimized ? 'Maximize' : 'Minimize'}
            >
              {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
            </button>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="h-full">
            <ResizableBox
              width={size.width}
              height={size.height - 48}
              minConstraints={[300, 400]}
              maxConstraints={[500, 700]}
              onResize={(e: any, data: any) => {
                setSize({
                  width: data.size.width,
                  height: data.size.height + 48
                });
              }}
              handle={<div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400" />}
            >
              <div className="w-full h-full relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Loading JustCall dialer...</p>
                    </div>
                  </div>
                )}
                
                {hasError ? (
                  <div className="w-full h-full bg-red-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-red-500 mb-2">⚠️</div>
                      <p className="text-sm text-red-600 mb-2">Failed to load JustCall dialer</p>
                      <button
                        onClick={() => {
                          setHasError(false);
                          setIsLoading(true);
                        }}
                        className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ) : (
                              <iframe
                                key={isInCall ? 'stable-call' : (phoneNumber || 'default')} // Prevent reload when in call
                                src={dialerUrl}
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                title="JustCall Dialer"
                                allow="microphone; camera; geolocation; autoplay"
                                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                                className="rounded-b-lg"
                                style={{ 
                                  border: 'none',
                                  background: 'white',
                                  minHeight: '100%',
                                  minWidth: '100%'
                                }}
                                onLoad={() => {
                                  console.log('JustCall dialer iframe loaded');
                                  setIsLoading(false);
                                }}
                                onError={(e) => {
                                  console.error('JustCall dialer iframe error:', e);
                                  setIsLoading(false);
                                  setHasError(true);
                                }}
                              />
                )}
              </div>
            </ResizableBox>
          </div>
        )}
      </div>
    </Draggable>
  );
}
