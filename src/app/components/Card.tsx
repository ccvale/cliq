'use client'

import React, { useEffect, useState } from 'react'
import TinderCard from 'react-tinder-card'
import { onSwipe } from '@/lib/onSwipe'
import { onCardLeftScreen } from '@/lib/onCardLeftScreen'
import { User } from '../../../types'
import Image from 'next/image'
import GlobeAltIcon from '@heroicons/react/24/outline/esm/GlobeAltIcon' // location
import BriefcaseIcon from '@heroicons/react/24/outline/esm/BriefcaseIcon' // position
import haversine from 'haversine-distance'
import geocoding from '@/lib/geocoding'
import { generateRandomUser } from '@/lib/generateRandomUser'


// TODO: add in icons for each different section (i.e. location, position) -> https://heroicons.com/ and import them
// TODO: or, look into using a different library for the cards (like from the tutorial?)
// TODO: we also want to replace the buttons in the dashboard page with icons, spread them out, and make them bigger

type Props = {
    params: {
        user: User,
    }
}

const from: { [key: string]: string } = {
    slate: 'from-slate-500',
    gray: 'from-gray-500',
    zinc: 'from-zinc-500',
    neutral: 'from-neutral-500',
    stone: 'from-stone-500',
    red: 'from-red-500',
    orange: 'from-orange-500',
    amber: 'from-amber-500',
    yellow: 'from-yellow-500',
    lime: 'from-lime-500',
    green: 'from-green-500',
    cyan: 'from-cyan-500',
    blue: 'from-blue-500',
    indigo: 'from-indigo-500',
    purple: 'from-purple-500',
    pink: 'from-pink-500',
    violet: 'from-violet-500',
    rose: 'from-rose-500',
    teal: 'from-teal-500'
};

const to: { [key: string]: string } = {
    slate: 'to-slate-300',
    gray: 'to-gray-300',
    zinc: 'to-zinc-300',
    neutral: 'to-neutral-300',
    stone: 'to-stone-300',
    red: 'to-red-300',
    orange: 'to-orange-300',
    amber: 'to-amber-300',
    yellow: 'to-yellow-300',
    lime: 'to-lime-300',
    green: 'to-green-300',
    cyan: 'to-cyan-300',
    blue: 'to-blue-300',
    indigo: 'to-indigo-300',
    purple: 'to-purple-300',
    pink: 'to-pink-300',
    violet: 'to-violet-300',
    rose: 'to-rose-300',
    teal: 'to-teal-300'
};

async function calculateDistanceBetweenTowns(town1: string, town2: string): Promise<number> {
    const town1Coordinates = await geocoding(town1);
    const town2Coordinates = await geocoding(town2);

    if (!town1Coordinates || !town2Coordinates) {
        return -999;
    }

    const distance = haversine({ lat: town1Coordinates[0], lng: town1Coordinates[1] }, { lat: town2Coordinates[0], lng: town2Coordinates[1] });
    return Math.round(distance * 0.000621371); // Convert to miles and round off
}

function convertToClass(fromColor: string, toColor: string, baseClass: string): string {
    let className: string = baseClass;
    if (fromColor && toColor) {
        className += ` bg-gradient-to-r ${from[fromColor]} ${to[toColor]}`;
    }
    return className;
}

export default function Card({ params: { user: initialUser } }: Props) {
    const [user, setUser] = useState(initialUser); // State to manage the current user
    const { name, age, position, positionAt, bio, location, interests, palette } = user;
    const [distanceTag, setDistanceTag] = useState('Calculating distance...');
    const randomNumber = Math.floor(Math.random() * (500 - 300 + 1) + 300); // for testing the image scaling
    const defaultUserLocation = "Wayne, NJ";

    useEffect(() => {
        async function fetchDistance() {
            if (location) {
                const distance = await calculateDistanceBetweenTowns(defaultUserLocation, location);
                let distanceText = 'unknown distance';

                if (distance >= 0 && distance < 10) {
                    distanceText = "< 10 miles away";
                } else if (distance >= 10) {
                    distanceText = `${distance} miles away`;
                }

                setDistanceTag(distanceText);
            }
        }

        fetchDistance();
    }, [location]);

    let defaultPalette = "text-white rounded-xl p-5 w-full md:w-1/4 flex flex-col justify-start items-end gap-2 mx-auto grow mb-20 drop-shadow-3xl text-center font-bold shadow-2xl h-full";
    defaultPalette = convertToClass(palette[0], palette[1], defaultPalette);

    const swipeFunction = (direction: string) => {
        if (direction === 'right') {
            console.log('HORRAYYYY');
        }
        else if (direction === 'left') {
            console.log('BOOOOO');
        }
    }

    const cardGoneFunction = (direction: string) => {
        console.log('User has left the screen - get a new card!');
        const newUser = generateRandomUser();
        setUser(newUser); // Update the user with a new user
        console.log(newUser);
    }



    return (
        <TinderCard onSwipe={(direction) => swipeFunction(direction)} onCardLeftScreen={cardGoneFunction} preventSwipe={['up', 'down']}>
            <div className={defaultPalette + ' flex flex-col items-center pointer-events-none'} style={{ userSelect: 'none' }}>
                <div className="flex items-end mb-4">
                    <Image className="h-20 w-20 object-cover rounded-full mx-auto block" src={`https://placekitten.com/500/${randomNumber}`} alt={`${name}'s profile`} width={500} height={500} />
                </div>
                <div className="flex justify-end w-full pr-4">
                    <div className="flex flex-col items-end">
                        <h1 className="text-4xl">{name}</h1>
                        <h1 className="text-3xl">{age}</h1>
                        <span className="text-sm italic font-semibold">{distanceTag}</span>
                    </div>
                </div>
                <div className="flex justify-center items-center mb-4">
                    <h1 className="text-center italic font-light whitespace-pre-line">
                        {bio}
                    </h1>
                </div>
                <div className="flex flex-col items-center">
                    <div className='flex items-center'>
                        <GlobeAltIcon className="h-5 w-5 mr-2" />
                        <h3>
                            {location}
                        </h3>
                    </div>

                    <div className="flex items-center">
                        <BriefcaseIcon className="h-5 w-5 mr-2" />
                        <h3>{position} at {positionAt}</h3>
                    </div>
                    <div className="flex-grow mt-4">
                        <h3>Interests</h3>
                        <ul className="flex flex-row justify-center items-center gap-5 mx-auto">
                            {interests?.map((interest) => (
                                <li key={interest} className="">
                                    <p>{interest}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </TinderCard>
    );
}