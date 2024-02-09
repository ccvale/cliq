'use client'

import React, { useEffect, useState } from 'react';
import TinderCard from 'react-tinder-card';
import Image from 'next/image';
import GlobeAltIcon from '@heroicons/react/24/outline/esm/GlobeAltIcon'; // location
import BriefcaseIcon from '@heroicons/react/24/outline/esm/BriefcaseIcon'; // position
import CheckBadgeIcon from '@heroicons/react/24/solid/esm/CheckBadgeIcon';
import { ArrowLeftCircleIcon, ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import useSWRMutation from 'swr/mutation';
import updateUser from '@/lib/updateUser';
import calculateAge from '@/lib/calculateAge';
import calculateDistanceBetweenTowns from '@/lib/calculateDistanceBetweenTowns';
import { UsersRecord } from '@/xata';
import { ExtendedUser } from '../../../types';
import getUser from '@/lib/getUser';

type Props = {
    sessionUser: ExtendedUser,
    filteredUsers: ExtendedUser[] // its an array of user objects
}

export default function SwipeQueue({ sessionUser, filteredUsers }: Props) {

    /*
        NAME

            SwipeQueue - React component that generates and maintains the user's swipe queue

        SYNOPSIS

            SwipeQueue({ sessionUser, filteredUsers })
                - sessionUser: ExtendedUser - the current user's information (from database)
                - filteredUsers: ExtendedUser (array of) - the filtered users based on sessionUser's preferences

        DESCRIPTION

            This component will generate the user's swipe queue based on the filtered users from the database.
            It will also maintain the queue, and update it as the user swipes left or right on a card.
            It will also update the user's swipe history.
    */

    // setting up the state variables that will be used to maintain the user's swipe queue, etc.
    const [users, setUsers] = useState<ExtendedUser[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [distanceTags, setDistanceTags] = useState<string[]>(new Array(filteredUsers.length).fill('Calculating distance...'));
    const [image, setImages] = useState([]); // array of image urls
    const [age, setAge] = useState<(number | "N/A")[]>([]);
    const defaultUserLocation = "N/A, N/A";
    
    // this is the swr mutation hook that will be used to update the user's likes and matches
    const { trigger } = useSWRMutation('/api/updateUser', updateUser);

    const [rightSwipes, setRightSwipes] = useState(0);
    const [leftSwipes, setLeftSwipes] = useState(0);


    useEffect(() => {
        setUsers(filteredUsers); // filteredUsers are sorted by "score"

        fetchDistances(filteredUsers);
        fetchAge(filteredUsers);
    }, []);

    const fetchDistances = async (users: UsersRecord[]) => {

        /*
        NAME

           fetchDistances - fetches the distances between the current user and the other users in the queue, and updates the distance tags

        SYNOPSIS

            fetchDistances(users)
                - users: UsersRecord array - the filtered users based on sessionUser's preferences

        DESCRIPTION

            This function will fetch the distances between the current user and the other users in the queue, and update the distance tags.
            It will also update the distance tags as the user swipes left or right on a card.
    */

        const newDistanceTags = await Promise.all(
            // for each user, calculate the distance between the current user and the other users in the queue, and set the distance tag
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

    const fetchAge = async (users: UsersRecord[]) => {
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
            // for each user, calculate the age of the user, and set the age for the user card
            users.map(async (user) => {
                if (user.birthday) {
                    const age = calculateAge(user);
                    return age;
                }
                return 'N/A';
            })
        );
        setAge(newAge);
    };

    const swiped = async (direction: string) => {
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

        if (!(currentIndex >= users.length)) {
        
            
            setCurrentIndex(currentIndex + 1); // move to the next user in the queue

            if (direction === 'right') {

                const sessionUserData = (await getUser(sessionUser.id));
                const likedUserData = (await getUser(users[currentIndex].id));
                
                const likedUserLikes = likedUserData.likes;
                const likedUserMatches = likedUserData.matches;

                const sessionUserLikes = sessionUserData.likes;
                const sessionUserMatches = sessionUserData.matches;


                setRightSwipes(prev => prev + 1);
                const liked = users[currentIndex];
                // if other user has this user in likes already, its a match (both users have liked each other)
                const isMatch = likedUserLikes?.includes(sessionUser.userId) || false; 
                // we want to add the user id to the sessionUser's liked array, then also check for match...if match, add to matches array
                
                // updating a like for just the session user - since only the session user is swiping
                const sessionUserLike = sessionUser.likes
                    ? [...sessionUserLikes, liked.userId]
                    : [liked.userId];
                
                // updating the session user's data and the other user's data:

                const updatedSessionData = {
                    id: sessionUser.id,
                    likes: sessionUserLike,
                    matches: isMatch
                        ? (sessionUserMatches
                            ? [...sessionUserMatches, `${liked.id} - ${liked.userId} - ${liked.display_name} - ${liked.image} - ${liked.isVerified}`]
                            : [`${liked.id} - ${liked.userId} - ${liked.display_name} - ${liked.image} - ${liked.isVerified}`])
                        : sessionUserMatches
                };

                const updatedOtherData = {
                    id: liked.id,
                    matches: isMatch
                        ? (likedUserMatches
                            ? [...likedUserMatches, `${sessionUser.id} - ${sessionUser.userId} - ${sessionUser.display_name} - ${sessionUser.image} - ${sessionUser.isVerified}`]
                            : [`${sessionUser.id} - ${sessionUser.userId} - ${sessionUser.display_name} - ${sessionUser.image} - ${sessionUser.isVerified}`])
                        : likedUserMatches
                };

                // these lines continue to give warnings, but the logic continues to be correct
                const sessionUserLikeUpdate = await trigger(updatedSessionData);
                const otherUserLikeUpdate = await trigger(updatedOtherData);
            }
            else if (direction === 'left') {
                // we don't care about a user that was swiped left on, but we still want to update the swipe history
                setLeftSwipes(prev => prev + 1);
            }
        };

    };

    // bottom of the page 'session stats' calculations
    const totalSwipes = rightSwipes + leftSwipes;
    const swipePercentage = totalSwipes > 0 ? Math.round((rightSwipes / totalSwipes) * 100) : 0;

    let swipeMessage = ''; // maybe have multiple messages to randomly choose from for each level, in the future?
    if (swipePercentage < 20) {
        swipeMessage = 'Maybe try being less picky!';
    } else if (swipePercentage < 50) {
        swipeMessage = 'Quality over quantity, huh?';
    } else if (swipePercentage < 80) {
        swipeMessage = 'Keep up the swiping!';
    } else {
        swipeMessage = 'You sure are friendly!';
    }

    // the logic here:
    // if there are still users in the queue, queue up the next user
    // if there are no more users in the queue, display a message to the user
    // on swipe, or button click, respond accordingly
    return (
        <div>
            {users.length > 0 && currentIndex < users.length ? (
                <TinderCard
                    key={users[currentIndex].userId}
                    onSwipe={(dir) => swiped(dir)}
                    preventSwipe={['up', 'down']}
                >
                    <UserCard user={users[currentIndex]} distanceTag={distanceTags[currentIndex]} />
                </TinderCard>

            ) : (
                <div className="text-center p-10">
                        <h2 className="text-2xl font-bold mb-5 text-indigo-700 hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>Wow! You&apos;ve been busy swiping!</h2>
                        
                        <p className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>There is nobody new left to swipe on for now...come back later!</p>
                        
                        <p className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>If you&apos;re new here, you should update your settings first and try again!</p>
                </div>
            )}

            <div className="flex flex-row justify-center items-center mx-auto -mt-8 gap-56">
                <button onClick={() => swiped('left')}>
                    <ArrowLeftCircleIcon className="text-red-400 w-14 h-14" />
                </button>

                <button onClick={() => swiped('right')}>
                    <ArrowRightCircleIcon className="text-green-400 w-14 h-14" />
                </button>
            </div>

            <div>
                <section className="flex flex-col justify-center items-center text-center p-5">
                    <h1 className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>Current session stats: </h1>

                    <h1 className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>{rightSwipes} right swipes - {leftSwipes} left swipes</h1>

                    <h1 className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>{swipePercentage}% like rate <span className="italic text-sm">{swipeMessage}</span></h1>
                </section>
            </div>
        </div>
    );
}

function UserCard({ user, distanceTag }: { user: ExtendedUser, distanceTag: string }) {

    /*
        NAME

            UserCard - generates the user card for the swipe queue

        SYNOPSIS

            UserCard({ user, distanceTag })
                - user: ExtendedUser - the user object
                - distanceTag: string - the distance tag for the user

        DESCRIPTION

            This component will generate the user card for the swipe queue. It will display the user's information, including data given by the user and calculated data, such as age and distance away from the current user. Each card is displayed with a custom color theme based on the user's preferences as well.
    */
    
    const ageThisYear = calculateAge(user);

    // logic here: render out all the information passed through the user object
    // for everything that the user has, fill it out as designed. by this point, cases where these values are null shouldn't exist in the first place, so we can assume that there will always be a value to be filled out
    return (
        <div className={user.cardTheme} style={{ userSelect: 'none' }}>
            {user.image && <Image src={user.image} alt={`${user.display_name}'s profile`} width={500} height={500} className="h-20 w-20 object-cover rounded-full mx-auto block" />}

            <h1 className="text-4xl flex items-center justify-center">
                {user.display_name}
                {user.isVerified && <CheckBadgeIcon className="h-6 w-6 text-white ml-1" />}
            </h1>

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