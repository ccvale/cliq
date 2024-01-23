'use client'

import React, { useEffect, useState } from 'react';
import TinderCard from 'react-tinder-card';
import { User } from '../../../types';
import Image from 'next/image';
import GlobeAltIcon from '@heroicons/react/24/outline/esm/GlobeAltIcon'; // location
import BriefcaseIcon from '@heroicons/react/24/outline/esm/BriefcaseIcon'; // position
import haversine from 'haversine-distance';
import geocoding from '@/lib/geocoding';
import { getFilteredUsers } from '@/lib/getFilteredUsers';
import { clerkClient } from '@clerk/nextjs';
import useSWRMutation from 'swr/mutation';
import updateUser from '@/lib/updateUser';


type Props = {
    sessionUser: any,
    filteredUsers: any // its an array of JSON objects
}

export default function SwipeQueue({ sessionUser, filteredUsers }: Props) {
    
    /*
        NAME

            SwipeQueue - React component that generates and maintains the user's swipe queue

        SYNOPSIS

            SwipeQueue({ sessionUser, filteredUsers })
                - sessionUser: JSON object - the current user's information (from database)
                - filteredUsers: JSON object - the filtered users based on sessionUser's preferences

        DESCRIPTION

            This component will generate the user's swipe queue based on the filtered users from the database.
            It will also maintain the queue, and update it as the user swipes left or right on a card.
            It will also update the user's swipe history.
    */

    const [users, setUsers] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [distanceTags, setDistanceTags] = useState([]);
    const [image, setImages] = useState([]); // array of image urls
    const [age, setAge] = useState(0);
    const defaultUserLocation = "N/A, N/A";

    const { trigger } = useSWRMutation('/api/updateUser', updateUser);


    useEffect(() => {
        setUsers(filteredUsers);
        setDistanceTags(new Array(filteredUsers.length).fill('Calculating distance...')); // is needed to prevent the distance tag from being undefined

        fetchDistances(filteredUsers);
        fetchAge(filteredUsers);
    }, []);

    const fetchDistances = async (users) => {

        /*
        NAME

           fetchDistances - fetches the distances between the current user and the other users in the queue, and updates the distance tags

        SYNOPSIS

            fetchDistances(users)
                - users: JSON object - the filtered users based on sessionUser's preferences

        DESCRIPTION

            This function will fetch the distances between the current user and the other users in the queue, and update the distance tags.
            It will also update the distance tags as the user swipes left or right on a card.
    */

        const newDistanceTags = await Promise.all(
            users.map(async (user) => {
                if (user.location) {
                    const distance = await calculateDistanceBetweenTowns(sessionUser.location, user.location);
                    return distance >= 0 && distance < 10 ? "< 10 miles away" : `${distance} miles away`;
                }
                return 'N/A miles away';
            })
        );
        setDistanceTags(newDistanceTags);
    };

    const fetchAge = async (users) => {
        /*
            NAME

                fetchAge - fetches the ages of the users in the queue, and updates the age array

            SYNOPSIS

                fetchAge(users)
                    - users: JSON object - the filtered users based on sessionUser's preferences

            DESCRIPTION

                This function will fetch the ages of the users in the queue, and update the age array.
                It will also update the age array as the user swipes left or right on a card.
        */
        
        const newAge = await Promise.all(
            users.map(async (user) => {
                if (user.birthday) {
                    const age = await calculateAge(user.birthday);
                    return age;
                }
                return 'N/A';
            })
        );
        setAge(newAge);
    };

    const swiped = async (direction) => {
        /*
            NAME

                swiped - updates the user's swipe history and swipe queue

            SYNOPSIS

                swiped(direction)
                    - direction: string - the direction the user swiped on the card

            DESCRIPTION

                This function will update the user's swipe history and swipe queue.
                It will also update the user's swipe history as the user swipes left or right on a card.
                Updates to the database are made as so:
                
                - If the user swipes right on a user, that user is added to the user's likes array.
                - If the user swipes right on a user, and that user has already liked the user, that user is added to both users matches array.
        */
        
        setCurrentIndex(currentIndex + 1); // Move to the next card in the queue

        // Update the user's swipe history
        if (direction === 'right') {
            const liked = users[currentIndex];
            const isMatch = liked.likes?.includes(sessionUser.userId) || false; // if other user has this user in likes already, its a match (both users have liked each other)
            // we want to add the user id to the sessionUser's liked array, then also check for match...if match, add to matches array
            const sessionUserLike = sessionUser.likes
                ? [...sessionUser.likes, liked.userId]
                : [liked.userId];
            
            const updatedSessionData = {
                id: sessionUser.id,
                likes: sessionUserLike,
                matches: isMatch
                    ? (sessionUser.matches
                        ? [...sessionUser.matches, `${liked.userId} - ${liked.display_name} - ${liked.image}`]
                        : [liked.userId])
                    : sessionUser.matches
            };

            const updatedOtherData = {
                id: liked.id,
                matches: isMatch
                    ? (liked.matches
                        ? [...liked.matches, `${sessionUser.userId} - ${sessionUser.display_name} - ${sessionUser.image}`]
                        : [sessionUser.userId])
                    : liked.matches
            };

            console.log('session user like update', updatedSessionData);
            console.log('other user like update', updatedOtherData);

            
            const sessionUserLikeUpdate = await trigger(updatedSessionData);
            const otherUserLikeUpdate = await trigger(updatedOtherData);
        }
    };

    const outOfFrame = (name) => {
        console.log(`${name} left the screen!`);
        // Optionally, handle the case when all cards are swiped away
        if (currentIndex >= users.length - 1) {
            // Logic when all users are swiped, e.g., reload users
        }
    };

    return (
        <div>
            {users.length > 0 && currentIndex < users.length ? (
                <TinderCard
                    key={users[currentIndex].userId}
                    onSwipe={(dir) => swiped(dir)}
                    onCardLeftScreen={() => outOfFrame(users[currentIndex].userId)}
                    preventSwipe={['up', 'down']}
                >
                    <UserCard user={users[currentIndex]} distanceTag={distanceTags[currentIndex]} />
                </TinderCard>
            ) : (
                <div className="text-center p-10">
                    <h2 className="text-2xl font-bold mb-5">Wow! You&apos;ve been busy swiping!</h2>
                    <p className="text-lg">There is nobody left to swipe on for now...come back later!</p>
                </div>
            )}
        </div>
    );
}

function calculateAge(user) {
    const today = new Date();
    const birthday = new Date(user.birthday);
    let ageThisYear = today.getFullYear() - birthday.getFullYear();

    // Adjust age if the user hasn't had their birthday yet this year
    if (today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())) {
        ageThisYear--;
    }
    return ageThisYear;
}

function UserCard({ user, distanceTag }) {
    const ageThisYear = calculateAge(user);

    return (
        <div className={user.cardTheme} style={{ userSelect: 'none' }}>
            <Image src={user.image} alt={`${user.display_name}&apos;s profile`} width={500} height={500} className="h-20 w-20 object-cover rounded-full mx-auto block"/>
            <h1 className="text-4xl">{user.display_name}</h1>
            <h2 className="text-3xl">{ageThisYear}</h2>
            <span className="text-sm italic font-semibold">{distanceTag}</span>
            <p className="text-center italic font-light whitespace-pre-line">{user.bio}</p>
            <div className='flex items-center'>
                <GlobeAltIcon className="h-5 w-5 mr-2" />
                <h3>{user.location}</h3>
            </div>
            <div className="flex items-center">
                <BriefcaseIcon className="h-5 w-5 mr-2" />
                <h3>{user.job_position} at {user.job_company}</h3>
            </div>
            <div className="flex-grow">
                <h3>Interests</h3>
                <ul className="flex flex-row justify-center items-center gap-5 mx-auto py-2">
                    {[user.primary_interest, user.secondary_interest, user.third_interest]?.map((interest) => (
                        <li key={interest} className="bg-white bg-opacity-40 rounded-full py-1 px-4">{interest}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

async function calculateDistanceBetweenTowns(town1: string, town2: string): Promise<number> {
    const town1Coordinates = await geocoding(town1);
    const town2Coordinates = await geocoding(town2);
    if (!town1Coordinates || !town2Coordinates) {
        return -999;
    }

    const distance = haversine({ lat: town1Coordinates[0], lng: town1Coordinates[1] }, { lat: town2Coordinates[0], lng: town2Coordinates[1] });
    return Math.round(distance * 0.000621371); // Convert to miles and round off
}
