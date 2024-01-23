# Cliq - making friends has never been easier

## Project Overview

The main concept of my senior project (working title is **Click**, and may be referred to as such throughout the proposal)  is to create a matchmaking web application that serves as an easy way for users to make platonic matches with other users on the platform. Users will be encouraged to create and customize their own profile, and tailor it accordingly to their individual likes and interests, with total control of which of their content is displayed and shared with other users. Users will ultimately have the ability to view a queue of profiles belonging to other users (within a user specified radius), and can swipe right (to like the profile) or left (to ignore the profile) with the hopes of making matches with users with similar interests. When a match is made, the two users will be allowed to connect and communicate within the app, using a chat feature, where hopefully these matches will cultivate friendships; or in other words, hopefully, they *click*.

## Project Requirements

Click will need to implement many different technologies to work at the ideal scale. As development begins, it may be possible that better solutions reveal themselves, assumingly making this list of requirements increase, or change entirely throughout the development of the project. As reading and researching has been ongoing for this project, many different resources have suggested additional tools to be included in the stack; they will not be mentioned in the list below for now, as I’m not yet certain if I will require their use; but now the primary task at hand is to look through these resources and decide what else I do need. In addition to the tech stack, there will be a requirement for the implementation of several APIs in order to extend user functionality (Google, Discord, Spotify, etc.) The stack is anticipated to look similar to the following:

### Tech Stack (predicted - not confirmed)

- Next.js/React, with Tailwind (front end)
- Node.js/Express (back end)
- MongoDB (database)
- Vercel (deployment)

## Expected Primary Features

This project is ambitious, and will hopefully have a lot of additional exciting features that realize themselves throughout production. These features cannot be foreseen, but those that will definitely play a key role in Click’s primary functionality would be as follows:

- **Complete user profile customization**

  - About section featuring biography, age, location, school/profession, etc.

    - *Note*: personal details (age, location, etc.) will be optional, just in case a user does not wish to share this information directly to other users

    - Highlightable interests, and other “icebreaker-esque details” (ex. Favorite song…)

    - Ability to upload a profile picture, and potentially one other image for a user to highlight on their profile (differs to dating apps, where multiple photos are required)

- **Chat features**

  - Users will be able to chat with matches if and only if a formal match has occurred

  - Users will have the ability to block (and report, if this project ever scales) their matches if they feel they have crossed a line, or said something explicit/inappropriate

    - They will also be allowed to “un-match” them at any time, instantly removing the ability for them to chat with each other

- **Swiping - the core functionality**

  - Each profile will be represented in the style of a card; this card will have all information from the users profile that they are sharing, and will be visible to other users

  - These cards will exist in a “swipe queue”, where they will show up one at a time, where the user can observe and interact with the card and determine whether or not this user is a potential friend they would like to have

  - Users that have swiped right on a given user will move up in that users swipe queue to ensure that they are seen quicker (given priority) with the goal of making quicker matches

    - In other words, if User A is “liked” by users B, and C, User A will see the profiles of users B, and C before they see an arbitrary User Z, who hasn’t “liked” User A

  - Users can swipe right (to like), or swipe left (to discard) on these cards as they wish

  - If both users have swiped right on each other, a match has occurred; both users will be notified, and they can now chat with each other

- **Setting additional filters**

  - Users will be able to filter the users they can see in their swipe queue based on certain criteria, to allow for a better scope of what they are looking for

    - Age (18+ users will not be able to set their lower age bound filter lower than 18, and vice-versa)

  - Gender (can filter on which genders you are open to making friendships with)

    - Distance (filterable in mile ranges from as local as the same city and as distant as separate continents)

- **Authenticating with Google or Discord**

  - Users will have the opportunity to sign-in with a Discord account, or with a Google account

    - This allows for easy account creation/setup, as well as a quicker login experience as well