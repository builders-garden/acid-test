import React, { useEffect } from 'react';
import { Loader, CheckCircle, XCircle } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  status: 'loading' | 'success' | 'error';
  message: string;
  onClose: () => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, status, message, onClose }) => {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (status === 'success' || status === 'error') {
      timer = setTimeout(() => {
        onClose();
      }, 2500); // Auto close after 2.5 seconds
    }

    return () => {
      clearTimeout(timer); // Clear the timer if the component unmounts or if the modal is closed
    };
  }, [status, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-black rounded-lg p-6 w-80 text-center text-white">
        {status === 'loading' && (
          <div>
            <Loader className="animate-spin h-8 w-8 mx-auto" />
            <h2 className="text-yellow-600">Awaiting</h2>
            <p>{message}</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
            <h2 className="text-green-600">Success!</h2>
            <p>{message}</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <XCircle className="h-8 w-8 text-red-600 mx-auto" />
            <h2 className="text-red-600">Error!</h2>
            <p>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal; 