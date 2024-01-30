'use client';
import React, { useState, useEffect, useRef } from 'react';
import useSWRMutation from 'swr/mutation';
import newMessage from '@/lib/newMessage';
import updateUser from '@/lib/updateUser';
import getUser from '@/lib/getUser';
import { XCircleIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';

// again, should get the types for these props
type Props = {
    sessionUser: any,
    userDetails: any,
    matchMessages: any
}

// set up socket connection
const socket = io('https://cliq-app-ae230a8c05bd.herokuapp.com/', {
    path: '/socket.io',
    transports: ['websocket'],
});

export default function ChatComponent({ sessionUser, userDetails, matchMessages }: Props) {

    const [activeChat, setActiveChat] = useState(null);
    const [currentChatHistory, setCurrentChatHistory] = useState([]);
    const [nMessage, setNewMessage] = useState("");
    const [organizedChats, setOrganizedChats] = useState({});

    const { trigger } = useSWRMutation('/api/newMessage', newMessage);
    const { trigger: userTrigger } = useSWRMutation('/api/updateUser', updateUser);

    // the next handful of lines are to make sure that when a chat window is opened, it opens up to the latest messages
    const messagesEndRef = useRef(null);

    const sessionColor = sessionUser.primary_palette.toString().toLowerCase();
    const sessionSecondary = sessionUser.secondary_palette.toString().toLowerCase();

    const template = `bg-gradient-to-r from-${sessionColor}-400 to-${sessionColor}-300 text-white`
    const template2 = `bg-gradient-to-r from-${sessionSecondary}-400 to-${sessionSecondary}-300 text-white`

    console.log(template, template2);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [organizedChats[activeChat]?.length]);

    // organizing chats to associate each chat with the user it is with
    useEffect(() => {
        const chats = {};
        matchMessages.forEach(message => {
            const otherUserId = message.sender_id === sessionUser.userId ? message.receiver_id : message.sender_id;
            if (!chats[otherUserId]) {
                chats[otherUserId] = [];
            }
            chats[otherUserId].push(message);
        });
        setOrganizedChats(chats);
    }, [matchMessages, sessionUser.userId]);


    // used to set the current chat history to the active chat (the chat that the user has selected)
    useEffect(() => {
        if (activeChat !== null) {
            setCurrentChatHistory(organizedChats[activeChat] || []);
        }
    }, [activeChat, organizedChats]);

    // this is the socket listener that listens for new messages from the server (live updates, basically)
    useEffect(() => {
        socket.on('receiveMessage', (message) => {
            setCurrentChatHistory(prevHistory => [...prevHistory, message]);
            setOrganizedChats(prevChats => ({
                ...prevChats,
                [message.sender_id]: [...(prevChats[message.sender_id] || []), message]
            }));
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, []);


    const handleSendMessage = async () => {
        if (nMessage.trim() !== "") {
            const newSentMessage = {
                sender_id: sessionUser.userId,
                receiver_id: activeChat,
                message: nMessage
            };

            // Update the currentChatHistory
            setCurrentChatHistory(prevHistory => [...prevHistory, newSentMessage]);

            // Also update organizedChats with the new message
            setOrganizedChats(prevChats => ({
                ...prevChats,
                [activeChat]: [...(prevChats[activeChat] || []), newSentMessage]
            }));

            setNewMessage(""); // Clear the input field

            // Send the message to the server
            try {
                const response = await trigger(newSentMessage);
                await socket.emit('sendMessage', newSentMessage);
                //console.log("Message sent, server response:", response);
            } catch (error) {
                console.error("Failed to send message:", error);
                // Handle failed message sending (e.g., show an error message)
            }
        }
    };

    const handleUnmatchUser = async (user) => {
        if (window.confirm(`Are you sure you would like to unmatch ${user.displayName}?`)) {

            // remove each other from matches
            const sessionUpdatedMatches = sessionUser.matches.filter(item => !item.includes(user.id));
            const sessionUpdatedLikes = sessionUser.likes.filter(item => !item.includes(user.userId));
            const sessionUpdatedUser = { id: sessionUser.id, matches: sessionUpdatedMatches, likes: sessionUpdatedLikes };

            const matchUserData = (await getUser(user.id));

            const matchUserMatches = matchUserData.matches;
            const matchUserLikes = matchUserData.likes;

            const matchUpdatedMatches = matchUserMatches.filter(item => !item.includes(sessionUser.id));
            const matchUpdatedLikes = matchUserLikes.filter(item => !item.includes(sessionUser.userId));
            const matchUpdatedUser = { id: user.id, matches: matchUpdatedMatches, likes: matchUpdatedLikes };

            await userTrigger(sessionUpdatedUser);
            await userTrigger(matchUpdatedUser);


            window.location.reload(); // reloading the page to reflect the change in matches
        }
    };

    return (
        <div className="flex h-screen">
            {/* Left panel */}
            <div className={`w-2/3 bg-gradient-to-r from-${sessionUser.primary_palette.toString().toLowerCase()}-300 to-${sessionUser.secondary_palette.toString().toLowerCase()}-400 p-4 overflow-y-auto shadow-lg rounded-lg`}>
                <h1 className="text-2xl font-bold text-white mb-6">Chats</h1>
                <div>
                    {userDetails.map((user, index) => {
                        const lastMessage = organizedChats[user.userId] ? organizedChats[user.userId][organizedChats[user.userId].length - 1] : null;
                        const lastMessageTime = lastMessage ? new Date(lastMessage.xata?.updatedAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                            <div key={index}
                                className={`flex items-center mb-4 p-2 rounded-lg cursor-pointer ${activeChat === user.userId ? 'bg-indigo-300' : 'hover:bg-indigo-200'}`}
                                onClick={() => setActiveChat(user.userId)}>
                                <img src={user.imageUrl} alt={user.displayName} className="h-12 w-12 rounded-full mr-3" />
                                <div className="flex flex-col flex-grow">
                                    <div className="flex justify-between">
                                        <p className="font-medium text-white">{user.displayName}</p>
                                        <p className="text-xs text-white">{lastMessageTime}</p>
                                    </div>
                                    {lastMessage && (
                                        <p className="text-sm text-white">{lastMessage.message}</p>
                                    )}
                                </div>
                                <button onClick={(e) => {
                                    e.stopPropagation(); // prevents triggering the onClick event
                                    handleUnmatchUser(user);
                                }} className="p-1 rounded-full hover:bg-gray-100">
                                    <XCircleIcon className="h-6 w-6 text-indigo-500" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right panel (Chat interface) */}
            <div className="w-2/3 flex flex-col h-5/6 bg-white">
                {/* Chat Header */}
                {activeChat !== null && userDetails.find(user => user.userId === activeChat) && (
                    <div className="p-3 border-b border-gray-300">
                        <h2 className="text-lg font-semibold">{userDetails.find(user => user.userId === activeChat).displayName}</h2>
                    </div>
                )}

                {/* Message Display Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100% - 4rem)' }} ref={messagesEndRef}>
                    {activeChat && organizedChats[activeChat] ? (
                        organizedChats[activeChat].map((msg, index) => (
                            <div key={index} className={`flex flex-col ${msg.sender_id === sessionUser.userId ? "items-end" : "items-start"}`}>
                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-2 rounded-lg ${msg.sender_id === sessionUser.userId ? template : template2}`}>
                                    {msg.message}
                                </div>
                                <span className="text-xs text-gray-500 mt-1">
                                    {
                                        msg.xata?.updatedAt
                                            ? new Date(msg.xata.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    }
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center pt-52 text-3xl text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>
                            Select a chat to view it here!
                        </div>
                    )}
                </div>


                {/* Typing Area */}
                {activeChat !== null && (
                    <div className="p-3 border-t border-gray-300 flex bg-white">
                        <input
                            type="text"
                            value={nMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault(); // Prevents the default action of the enter key
                                    handleSendMessage();
                                }
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded-lg mr-2"
                            placeholder="Type a message..."
                        />
                        <button
                            onClick={handleSendMessage}
                            className="bg-gradient-to-r from-indigo-400 to-indigo-400 text-white px-4 py-2 rounded-lg hover:from-indigo-300 hover:to-indigo-300"
                        >
                            Send
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}