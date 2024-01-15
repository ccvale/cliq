'use client'
import React, { useState } from 'react';

const ChatPage = () => {
    const [currentChat, setCurrentChat] = useState(null);
    const chats = []; // Array of chat previews. Populate this with real data.

    return (
        <div className="flex h-screen bg-gray-200">
            {/* Chat Previews */}
            <div className="w-1/3 bg-white overflow-y-auto">
                {chats.length > 0 ? (
                    chats.map((chat, index) => (
                        <div
                            key={index}
                            className="p-4 hover:bg-gray-100 cursor-pointer"
                            onClick={() => setCurrentChat(chat)}
                        >
                            {/* Render chat preview here */}
                            Chat {chat.id}
                        </div>
                    ))
                ) : (
                    <div className="p-4">No chats available</div>
                )}
            </div>

            {/* Chat Display */}
            <div className="w-2/3 bg-gray-100 flex items-center justify-center">
                {currentChat ? (
                    <div>
                        {/* Chat content goes here */}
                        <h1 className="text-lg font-bold">Chat with {currentChat.id}</h1>
                        {/* Render messages */}
                    </div>
                ) : (
                    <div className="text-lg text-gray-600">Select a chat to start</div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;
