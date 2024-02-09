'use client';

import React, { useState, useEffect, useRef } from 'react';
import useSWRMutation from 'swr/mutation';
import newMessage from '@/lib/newMessage';
import updateUser from '@/lib/updateUser';
import getUser from '@/lib/getUser';
import { XCircleIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';
import CheckBadgeIcon from '@heroicons/react/24/solid/CheckBadgeIcon';
import { UsersRecord } from '@/xata';
import { MessageMetadata, MinimizedChatData, PopupUser, ExtendedUser } from '../../../types';
import removeMessages from '@/lib/removeMessages';


type Props = {
    sessionUser: UsersRecord,
    userDetails: MinimizedChatData[],
    matchMessages: MessageMetadata[]
}

// set up socket connection to the server
const socket = io('https://cliq-app-ae230a8c05bd.herokuapp.com/', {
    path: '/socket.io',
    transports: ['websocket'],
});

export default function ChatComponent({ sessionUser, userDetails, matchMessages }: Props) {

    /*
            NAME

                ChatComponent - the component that is responsible for the chat functionality of the application

            SYNOPSIS

                ChatComponent({ sessionUser, userDetails, matchMessages })
                - sessionUser: the user that is currently logged in
                - userDetails: the details of the users that the current user is matched with
                - matchMessages: the messages that the current user has with the other users

            DESCRIPTION

                This component is responsible for the chat functionality of the application, and handles all the client-side logic for the chat page.

                Responsibilities of this component include:
                - Displaying the chat interface
                - Allowing users to see their matches and chat with them
                - Sending and receiving messages in real-time
                - Allowing users to unmatch with other users
    */

    // settings up states
    const [activeChat, setActiveChat] = useState(null);
    const [currentChatHistory, setCurrentChatHistory] = useState([]);
    const [nMessage, setNewMessage] = useState("");
    const [organizedChats, setOrganizedChats] = useState({});
    const [nUserDetails, setUserDetails] = useState(userDetails);

    const { trigger } = useSWRMutation('/api/newMessage', newMessage);
    const { trigger: userTrigger } = useSWRMutation('/api/updateUser', updateUser);
    const {trigger: unmatchTrigger} = useSWRMutation('/api/removeMessages', removeMessages);

    // setting up useRef to let us scroll to the bottom of the chat for each conversation window clicked
    const messagesEndRef = useRef<HTMLDivElement>(null);


    // initializing and calculating the primary and secondary colors for the user
    const sessionColor = sessionUser.primary_palette?.toString().toLowerCase() ?? "indigo";
    const sessionSecondary = sessionUser.secondary_palette?.toString().toLowerCase() ?? "pink";

    const primaryAccent = `bg-${sessionColor}-400 text-white`
    const secondaryAccent = `bg-${sessionSecondary}-400 text-white`

    const selectorColor = `bg-${sessionColor}-300`
    const selectorHover = `hover:bg-${sessionColor}-200`

    // the way we scroll to the bottom of the chat window - utilizing the useRef hook to our specified div (in the html)
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    };

    // we want to then utilize the scrollToBottom function to scroll to the bottom of the chat window for each conversation window clicked
    useEffect(() => {
        scrollToBottom();
    }, [organizedChats[activeChat]?.length]);

    // organizing chats to associate each chat with the user it is with
    useEffect(() => {
        const chats = {};
        let lastMessageTimestamps = {};

        matchMessages.forEach((message) => {
            // the other user's id is the id of the user that is not the current user...we need this to associate the chat with the user
            const otherUserId = message.sender_id === sessionUser.userId ? message.receiver_id : message.sender_id;
            if (!chats[otherUserId]) {
                chats[otherUserId] = [];
            }
            chats[otherUserId].push(message); // associate the chat with the user "logs"

            // we need to keep track of the last message timestamp for each user, so we can sort the user details based on this
            const messageTimestamp = new Date(message.xata?.updatedAt || message.createdAt).getTime();
            lastMessageTimestamps[otherUserId] = Math.max(lastMessageTimestamps[otherUserId] || 0, messageTimestamp);
        });

        // sorting the user details based on the last message timestamp, so we can display the most recent chats first
        const sortedUserDetails = userDetails.sort((a, b) => lastMessageTimestamps[b.userId] - lastMessageTimestamps[a.userId]);

        setOrganizedChats(chats);
        setUserDetails(sortedUserDetails); // update the user details with the sorted user details
    }, [matchMessages, sessionUser.userId, userDetails]);


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

        /*
            NAME

                handleSendMessage - function that is responsible for sending a message to the server

            SYNOPSIS

                handleSendMessage()

            DESCRIPTION

                This function does the following:
                - Checks if the message is not empty
                - If the message is not empty, it sends the message to the server
                - It also updates the current chat history and organized chats with the new message

        */
        
        if (nMessage.trim() !== "") {
            // then we have a valid message that needs to be sent
            const newSentMessage = {
                sender_id: sessionUser.userId,
                receiver_id: activeChat,
                message: nMessage
            };

            // update the current chat history with the new message
            setCurrentChatHistory(prevHistory => [...prevHistory, newSentMessage]);

            // we also need to update the organized chats with the new message
            // either we are adding to an existing chat, or we are creating a new chat
            setOrganizedChats(prevChats => ({
                ...prevChats,
                [activeChat]: [...(prevChats[activeChat] || []), newSentMessage]
            }));

            setNewMessage(""); // clearing input field

            // sending message to database, and then to the server (for live updates)
            try {
                const response = await trigger(newSentMessage);
                await socket.emit('sendMessage', newSentMessage); // needs to await, even though it says it doesn't
                //console.log("Message sent, server response:", response);
            }
            catch (error) {
                console.error("Failed to send message:", error);
                // Handle failed message sending (e.g., show an error message)
            }
        }
    };

    const handleUnmatchUser = async (user: PopupUser) => {

        /*
            NAME

                handleUnmatchUser - function that is responsible for unmatching with a user

            SYNOPSIS

                handleUnmatchUser(user)
                - user (PopupUser): the user that the current user would like to unmatch with. Is custom type PopupUser, which is a subset of the continued User type, which is a quick way to get the user's id, display name, and image url.

            DESCRIPTION

                This function does the following:
                - Asks for confirmation from the user to unmatch with the other user
                - If the user confirms, it removes the other user from the current user's matches and likes
                - It also removes the current user from the other user's matches and likes
                - It then reloads the page to reflect the change in matches

        */
        
        if (window.confirm(`Are you sure you would like to unmatch ${user.displayName}?`)) {

            // remove each other from matches
            const sessionUpdatedMatches = sessionUser.matches?.filter(item => !item.includes(user.id)) || [];
            const sessionUpdatedLikes = sessionUser.likes?.filter(item => !item.includes(user.userId)) || [];
            const sessionUpdatedUser = { id: sessionUser.id, matches: sessionUpdatedMatches, likes: sessionUpdatedLikes };

            const matchUserData = (await getUser(user.id));

            const matchUserMatches = matchUserData.matches;
            const matchUserLikes = matchUserData.likes;

            const matchUpdatedMatches = matchUserMatches.filter((item: string | string[]) => !item.includes(sessionUser.id));
            const matchUpdatedLikes = matchUserLikes.filter((item: string | string[]) => !item.includes(sessionUser.userId));
            const matchUpdatedUser = { id: user.id, matches: matchUpdatedMatches, likes: matchUpdatedLikes };

            // in messages, we need to remove the chat history between the two users in the database
            

            // get the messages between the two users
            const messageIds = matchMessages.filter((message) => {
                return (message.sender_id === sessionUser.userId && message.receiver_id === user.userId) ||
                    (message.sender_id === user.userId && message.receiver_id === sessionUser.userId);
            }).map((message) => message.id);


            // as always, these cause squiggly lines, but they are correct
            await unmatchTrigger(messageIds);
            await userTrigger(sessionUpdatedUser);
            await userTrigger(matchUpdatedUser);

            window.location.reload(); // reloading the page to reflect the change in matches
        }
    };

    return (
        <div className="flex h-screen">
            {/* the left panel of the rendered chat component (shows all the active matches + convo details) */}

            {/* here, we iterate through all matched users, and display information about them. we also find the last message sent and display that message, and the timestamp on their respective section. we also render the unmatch button here */}
            <div className={`w-2/3 bg-gradient-to-r from-${sessionUser.primary_palette ? sessionUser.primary_palette.toString().toLowerCase() : 'indigo'}-300 to-${sessionUser.secondary_palette ? sessionUser.secondary_palette.toString().toLowerCase() : 'pink'}-400 p-4 overflow-y-auto shadow-lg rounded-lg`}>

                <h1 className="text-2xl font-bold text-white mb-6">Chats</h1>

                <div>
                    {userDetails.map((user, index) => {
                        const lastMessage = organizedChats[user.userId] ? organizedChats[user.userId][organizedChats[user.userId].length - 1] : null;
                        const lastMessageTime = lastMessage ? new Date(lastMessage.xata?.updatedAt || new Date()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                        return (
                            <div key={index}
                                className={`flex items-center mb-4 p-2 rounded-lg cursor-pointer ${activeChat === user.userId ? selectorColor : selectorHover}`}
                                onClick={() => setActiveChat(user.userId)}>
                                
                                <img src={user.imageUrl} alt={user.displayName} className="h-12 w-12 rounded-full mr-3" />

                                <div className="flex flex-col flex-grow">
                                    <div className="flex justify-between">
                                        <p className="flex items-center font-medium text-white">{user.displayName}{user.isVerified === 'true' && <CheckBadgeIcon className="h-4 w-4 text-white ml-1"/>}</p>

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
                                    <XCircleIcon className={`h-6 w-6 text-${sessionColor}-500`} />
                                </button>

                            </div>
                        );
                    })}
                </div>
            </div>

            {/* the right panel (chat interface) */}

            {/* here, we act when a chat is active - we get their information and display it up top */}
            <div className="w-2/3 flex flex-col h-5/6 bg-white">
                
                {activeChat !== null && userDetails.find(user => user.userId === activeChat) && (
                    <div className="p-3 border-b border-gray-300">

                        {userDetails.find(user => user.userId === activeChat) && (
                            <div className="flex items-center">
                                <h2 className="text-lg font-semibold">
                                    {userDetails.find(user => user.userId === activeChat)?.displayName}
                                </h2>

                                {userDetails.find(user => user.userId === activeChat)?.isVerified === 'true' && (
                                    <CheckBadgeIcon className={`h-4 w-4 text-${sessionColor}-500 ml-1`} />
                                )}

                            </div>
                        )}
                    </div>
                )}

                {/* the area that displays the sent/received messages */}

                {/* here, we display either a message telling the user to interact with the (selected) match, or it shows all the messages between them - formatted based on user palette settings. on the case where no chat is selected, we have a message that tells the user to select a conversation */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100% - 4rem)' }} ref={messagesEndRef}>

                    {activeChat && (organizedChats[activeChat] === undefined || organizedChats[activeChat].length === 0) ? (
                        <div className="text-center pt-52 text-2xl text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>
                            Why not introduce yourself to your new match already?
                        </div>

                    ) : activeChat ? (
                        organizedChats[activeChat].map((msg, index) => (
                            <div key={index} className={`flex flex-col ${msg.sender_id === sessionUser.userId ? "items-end" : "items-start"}`}>

                                <div className={`max-w-xs md:max-w-md lg:max-w-lg p-2 rounded-lg ${msg.sender_id === sessionUser.userId ? primaryAccent : secondaryAccent}`}>
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

                {/* the area where the user can input messages, and send them */}

                {/* here, we have our input bar, and the submit button. once a message is submitted, we call our handleSendMessage function to take care of the rest */}
                {activeChat !== null && (
                    <div className="p-3 border-t border-gray-300 flex bg-white">

                        <input
                            type="text"
                            value={nMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            className="flex-1 p-2 border border-gray-300 rounded-lg mr-2"
                            placeholder="Type a message..."
                        />

                        <button
                            onClick={handleSendMessage}
                            className={`${primaryAccent} text-white px-4 py-2 rounded-lg ${selectorHover}`}>
                            Send
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
}