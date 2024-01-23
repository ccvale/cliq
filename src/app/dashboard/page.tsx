import React from 'react'
import Card from '../components/Card'
import LikeButton from '../components/LikeButton'
import DislikeButton from '../components/DislikeButton'
import { generateRandomUser } from '@/lib/generateRandomUser';
import { auth, clerkClient, currentUser, getAuth } from '@clerk/nextjs/server'
import { ArrowRightCircleIcon } from '@heroicons/react/24/outline';
import { ArrowLeftCircleIcon } from '@heroicons/react/24/outline';
import ArrowUpCircleIcon from '@heroicons/react/24/outline';
import ArrowDownCircleIcon from '@heroicons/react/24/outline';
import SwipeQueue from '../components/Card';
import { getXataClient } from '@/xata';
import geocoding from '@/lib/geocoding';
import haversine from 'haversine-distance';

/**
 * When the user is authenticated, this is the page they will see.
 * This is the main page of the application, essentially.
 * Other user cards will be displayed here, and the user will be able to swipe right or left on them.
 * 
 * I am temporarily using a dummy card to test the functionality of the card and swipe features.
 */

// we will want to load in the user auth, and the xata client, and filter by users in a near location, then send those users to the card component

async function calculateDistanceBetweenTowns(town1: string, town2: string): Promise<number> {
  const town1Coordinates = await geocoding(town1);
  const town2Coordinates = await geocoding(town2);
  if (!town1Coordinates || !town2Coordinates) {
    return -999;
  }

  const distance = haversine({ lat: town1Coordinates[0], lng: town1Coordinates[1] }, { lat: town2Coordinates[0], lng: town2Coordinates[1] });
  return Math.round(distance * 0.000621371); // Convert to miles and round off
}

export default async function dashboard() {
  const user = await currentUser(); //seems to work
  //console.log(user);


  const xataClient = getXataClient();

  let userPreferences = await xataClient.db.Users.filter({ 'userId': user?.id }).getFirst();

  const filteredUsers = [];

  // fetch all users from xataClient where todays date minus their birthday is less than or equal to their age_filter[0] value
  // and todays date minus their birthday is greater than or equal to their age_filter[1] value
  if (userPreferences) {
    const today = new Date();
    const minAge = userPreferences.age_filter[0];
    const maxAge = userPreferences.age_filter[1];

    const currentUserLocation = userPreferences.location; // assuming 'location' is a field in userPreferences

    const minDistance = userPreferences.location_filter[0]; // minimum distance
    const maxDistance = userPreferences.location_filter[1]; // maximum distance

    const allUsers = await xataClient.db.Users.filter({
      $not: {
        userId: user?.id
      }
    }).getMany();

    for (const otherUser of allUsers) {

      // we don't want to look at a user if their user id is already in likes or matches
      if (userPreferences.likes?.includes(otherUser.userId) || userPreferences.matches?.includes(otherUser.userId)) {
        continue;
      }

      const birthday = new Date(otherUser.birthday);
      let ageThisYear = today.getFullYear() - birthday.getFullYear();

      // Adjust age if the user hasn't had their birthday yet this year
      if (today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())) {
        ageThisYear--;
      }

      const ageInRange = ageThisYear >= minAge && ageThisYear <= maxAge;
      if (ageInRange) {
        const distance = await calculateDistanceBetweenTowns(currentUserLocation, otherUser.location);
        if (distance >= minDistance && distance <= maxDistance) {
          const userData = (await clerkClient.users.getUser(otherUser?.userId));
          const userSerialized = otherUser.toSerializable();

          const cardTheme = `text-white rounded-xl p-5 w-full md:w-1/4 flex flex-col justify-start items-center gap-2 mx-auto grow mb-20 drop-shadow-3xl text-center font-bold shadow-2xl h-full bg-gradient-to-r from-${otherUser.primary_palette?.toLowerCase()}-500 to-${otherUser.secondary_palette?.toLowerCase()}-300` //seems to not work lol

          userSerialized.image = userData.imageUrl;
          userSerialized.cardTheme = cardTheme;
          filteredUsers.push(userSerialized);
        }
      }
    }
  }

  userPreferences = userPreferences?.toSerializable();
  const sessionUserData = (await clerkClient.users.getUser(userPreferences?.userId));
  userPreferences.image = sessionUserData.imageUrl;


  //iterate through filtered users, and run const userData = await clerkClient.users.getUser(user?.id) for each
  //then, push userData to filteredUsers array

  return (
    <>
      <SwipeQueue sessionUser={userPreferences} filteredUsers={filteredUsers}/>
      <div className="flex flex-row justify-center items-center mx-auto -mt-8 gap-56">
        <ArrowLeftCircleIcon className="text-red-400 w-14 h-14" />
        <ArrowRightCircleIcon className="text-green-400 w-14 h-14" />
      </div>
      <div>
        <section className="flex flex-col justify-center items-center text-center p-5">
          <h1 className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>Don't be shy! Swipe right if you like what you see!</h1>
          <h1 className="text-lg text-indigo-700 font-semibold hover:text-indigo-900 transition-colors duration-300" style={{ userSelect: 'none' }}>No worries if you don't; we'll get you another card right away!</h1>
        </section>
      </div>
    </>
  )
}