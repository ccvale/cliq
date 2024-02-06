import React from 'react'
import { clerkClient, currentUser } from '@clerk/nextjs/server'
import SwipeQueue from '../components/Card';
import { getXataClient } from '@/xata';
import calculateAge from '@/lib/calculateAge';
import calculateDistanceBetweenTowns from '@/lib/calculateDistanceBetweenTowns';
import scoringAlgorithm from '@/lib/scoring';

// we will want to load in the user auth, and the xata client, and filter by users in a near location, then send those users to the card component

export default async function Dashboard() {

  /*
        NAME

            Dashboard - function that is responsible for all the logic being passed to the dashboard page

        SYNOPSIS

            Dashboard()

        DESCRIPTION

            This function contains the logic for, what is essentially the main page of the entire application.

            The logic is as follows:

            - When we create a new user, this is done through Clerk. If a user is visiting the dashboard page, we want to check if they exist in the database.

              - If they do not exist, we want to add them to the database.

              - If they do, we want to find the user preferences, and then filter the other users by the user preferences, so we can display them on the dashboard.
    */
  
  const user = await currentUser(); // gets us our clerk user
  //console.log(user);

  const xataClient = getXataClient();

  // getting us our user, if exists
  let userPreferences = await xataClient.db.Users.filter({ 'userId': user?.id }).getFirst();
  
  // but if it doesn't exist, we want to create this user
  if (!userPreferences) {
    let newUser = await xataClient.db.Users.create({
      userId: user?.id,
      location_filter: ['0', '9999999'],
      age_filter: ['18', '100'],
      gender: 'Other'
    })

  }
  // would we want to revalidate path here, or refresh? consider...

  // will add users here if they match criteria, and eventually send them to the card component
  const filteredUsers = [];

  // fetch all users from xataClient where todays date minus their birthday is less than or equal to their age_filter[0] value
  // and todays date minus their birthday is greater than or equal to their age_filter[1] value
  if (userPreferences) {
    const userAge = calculateAge(userPreferences);

    // comparing against the user's age filter - if the user is under 18, we want to set the minimum age to 13,
    // and if the user is over 18, we want to set the minimum age to the user's age filter
    // if the user is under 18, we want to set the maximum age to 17, and if the user is over 18, we 
    // want to set the maximum age to the user's age filter
    const minAge = userPreferences.age_filter?.[0] ? (userAge < 18 ? 13 : Number(userPreferences.age_filter[0])) : 18;
    const maxAge = userPreferences.age_filter?.[1] ? (userAge < 18 ? 17 : Number(userPreferences.age_filter[1])) : 100;

    const currentUserLocation = userPreferences.location; 

    const minDistance = Number(userPreferences.location_filter?.[0]) ?? 0; // minimum distance - if not given, set to 0 (set to show all with min distance of 0 miles, essentially all close users will be shown...this is the default behavior if no distance is given)
    const maxDistance = Number(userPreferences.location_filter?.[1]) ?? 9999999; // maximum distance - if not given, set to 9999999 (essentially infinite distance, so all users will be shown)

    // searching for all users that are not the current user, so we can filter them
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

      const otherUserAge = calculateAge(otherUser);
      const ageInRange = otherUserAge >= minAge && otherUserAge <= maxAge;

      if (ageInRange) { // we don't care about other outcomes - we ignore if we don't have a full match
        const distance = await calculateDistanceBetweenTowns(currentUserLocation, otherUser.location);
        if (distance >= minDistance && distance <= maxDistance) { // only if user meets the age criteria, we check the distance criteria
          const userData = (await clerkClient.users.getUser(otherUser?.userId));

          // goal here is to combine data from xata and clerk, and then push it to the filteredUsers array (we will get type issues here if we don't do this properly, so we will need to create a new object with the combined data, and then push that object to the array)
          
          const userSerialized = otherUser.toSerializable();

          // formatting color theme for later
          const cardTheme = `text-white rounded-xl p-5 w-full md:w-1/4 flex flex-col justify-start items-center gap-2 mx-auto grow mb-20 drop-shadow-3xl text-center font-bold shadow-2xl h-full bg-gradient-to-r from-${otherUser.primary_palette?.toLowerCase()}-500 to-${otherUser.secondary_palette?.toLowerCase()}-300`

          // these will be squiggled - we need to create a new object with the combined data, and then push that object to the array
          userSerialized.image = userData.imageUrl;
          userSerialized.cardTheme = cardTheme;
          filteredUsers.push(userSerialized);
        }
      }
    }
  }

  userPreferences = userPreferences?.toSerializable();
  const sessionUserData = (await clerkClient.users.getUser(user?.id));

  if (userPreferences) {
    userPreferences.image = sessionUserData.imageUrl;
  }

  const sortedUsers = scoringAlgorithm(userPreferences, filteredUsers);

  return (
    <>
      <SwipeQueue sessionUser={userPreferences} filteredUsers={sortedUsers}/>
    </>
  )
}