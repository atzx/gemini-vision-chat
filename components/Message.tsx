import React, { useState } from 'react';
import { ChatMessage, MessagePart } from '../types';
import ImageModal from './ImageModal';

interface MessageProps {
    message: ChatMessage;
}

const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);

const ModelIcon = () => (
    <div className="w-8 h-8 rounded-full bg-cyan-500 flex-shrink-0 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    </div>
);

const MessageContent: React.FC<{ part: MessagePart }> = ({ part }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const imageUrl = part.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : '';

    if (part.text) {
        return <p className="whitespace-pre-wrap">{part.text}</p>;
    }

    if (part.inlineData) {
        return (
            <>
                <img 
                    src={imageUrl} 
                    alt="Chat content"
                    className="rounded-lg max-w-sm cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                />
                {isModalOpen && (
                    <ImageModal 
                        imageUrl={imageUrl} 
                        onClose={() => setIsModalOpen(false)} 
                    />
                )}
            </>
        );
    }

    return null;
};


const Message: React.FC<MessageProps> = ({ message }) => {
    const isUser = message.role === 'user';
    const isError = message.role === 'error';

    const containerClasses = isUser ? 'flex-row-reverse' : 'flex-row';
    const bubbleClasses = isUser 
        ? 'bg-blue-600' 
        : isError 
        ? 'bg-red-500'
        : 'bg-slate-700';
    
    return (
        <div className={`flex items-start space-x-3 space-x-reverse ${containerClasses}`}>
            {isUser ? <UserIcon /> : <ModelIcon />}
            <div className={`p-4 rounded-lg max-w-xl ${bubbleClasses}`}>
                 <div className="flex flex-col gap-4">
                    {message.parts.map((part, index) => (
                        <MessageContent key={index} part={part} />
                    ))}
                 </div>
            </div>
        </div>
    );
};

export default Message;
