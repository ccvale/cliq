# Cliq - making friends has never been easier

## Project Overview

The main concept of **Cliq** (stylistically for Click), was to create a matchmaking web application that serves as an easy way for users to make platonic matches with other users on the platform. Apps such as Tinder and Hinge have proven to be extremely effective, but begs one to ask the question, "If we can use these swipe apps to find quick intimate connections, why not use them to make platonic ones as well?" On Cliq, users are able to create and customize their own profile, and tailor it accordingly to their individual likes and interests. Users will ultimately view a familiarly structured queue of profiles, which belong to other users (within a user specified radius and age range), and can swipe right (to like the profile) or left (to ignore the profile) with the hopes of making matches with users with similar interests. When a match is made, the two users will be allowed to connect and communicate within the app, with direct messaging, where these matches will hopefully cultivate friendships; or in other words, hopefully, they *click*.

## Default Features for Proof of Concept

This project is ambitious, and has a lot of additional exciting features that have realized themselves throughout production. These features cannot all be included, (there are lots that had to be cut, or put to the side for a time where I don't have a deadline) but those features that are integral to Cliq’s primary functionality would be as follows:

- **Complete user profile customization**

  - Users present to others with a unique `card`, which contains user information such as: biography, age, location, school/profession, etc. ✅

  - Highlightable interests ✅

  - Ability to upload a profile picture, and display it on their profile (differs to dating apps, where multiple photos are required, and are the focal point of the profile) ✅

  - A custom `palette`, which consists of two selectable colors that will blend together to theme each user card ✅

    - This palette will also be used to theme the rest of the application, to give the user a sense of ownership over their user experience ✅

- **Chat features**

  - Users will be able to chat with matches if and only if a formal match has occurred ✅

  - Users will have the ability to unmatch (and report, if this project ever scales) their matches if they feel they have crossed a line, or said something explicit/inappropriate, instantly blocking them from further communication ✅

- **Swiping - the core functionality**

  - Each profile will be represented in the style of a card; this card will have all information from the users profile that they are sharing, and will be visible to other users ✅

  - These cards will exist in a “swipe queue”, where they will show up one at a time, where the user can observe and interact with the card and determine whether or not this user is a potential friend they would like to have ✅

  - Users that have swiped right on a given user will move up in that users swipe queue to ensure that they are seen quicker (given priority) with the goal of making quicker matches ✅

  - Users that match other aspects of the session users profile will also get a boost in swipe queue placement (ex. several matching interests) ✅

  - Users can swipe right (to like), or swipe left (to discard) on these cards as they wish ✅

  - If both users have swiped right on each other, a match has occurred; both users will be notified, and they can now chat with each other ✅

- **Setting additional filters**

  - Users will be able to filter the users they can see in their swipe queue based on certain criteria, to allow for a better scope of what they are looking for ✅

    - Age (18+ users will not be able to set their lower age bound filter lower than 18, and vice-versa) ✅

    - Distance (maximum distance is filterable in regards to miles away) ✅

- **Authenticating with third party services**

  - Alongside creating an account with a username + password, users can authenticate themselves with popular platforms such as Google, Discord, Twitch, and Tiktok ✅

## Future Features

In a project of this scale, there are many other features that I would like to implement, but due to time constraints, I was unable to do so. Those features include:

- **Further profile customization**

  - Re-addition of `prompts`, which are short questions that users can answer to further customize their profile, and give other users a better idea of who they are (scrapped due to redundancy, and an attempt to clean up the current design of the user card)

  - Ability to add a featured song to a user profile (similar to Tinder’s anthem feature; scrapped due to the idea not being unique enough - could come back with highlighting a TV show/movie, if the right API is found to support this)

  - Using current location to determine distance from other users, rather than using a set 'home location' (would be better suited for a mobile app though)

  - `Achievements` - a way for users to show off their accomplishments on the platform, such as "First Match", "First Message", "First Block", etc. Could be a fun way to gamify the platform, and encourage users to use the app more, and would be implemented with a `badge` system, where users can display their achievements on their profile

- **Additional chat features**

  - Ability to send other types of media (images, gifs, etc.)

  - Display an indicator when a user is typing, has read a message, or is currently online
