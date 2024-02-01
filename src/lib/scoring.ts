import { UsersRecord } from "@/xata";
import calculateAge from "./calculateAge";

// fix the typing for the users array
export default function scoringAlgorithm(sessionUser: UsersRecord, users: any[]) {
    /*
        NAME

            scoringAlgorithm - calculates a relevance score for each user

        SYNOPSIS

            scoringAlgorithm(sessionUser, users)
                - sessionUser: JSON object - the user who is currently logged in
                - users: array of JSON objects - the filtered users to score

        DESCRIPTION

            This function calculates a very simple/basic relevance score for each user. Deciding factors include age similarity, interest similarity, with extra points to those in the same town, work at the same company, or have the same job position. Most importantly, a big boost to users who have already liked the session user, and they will have a big chance to get to the top of the session users swipe queue. The score is calculated by adding points for each similarity and subtracting points for each difference. This orders the users by "relevance" and allows us to display the most relevant users first.

            Scoring breakdown as currently implemented:

            - 50 points for having already liked the session user (point bonus for priority)

            - 10 points for each common interest
                - 50 points total if all 3 interests match (20 point bonus)

            (not sure about this one, but it's a way to give a slight boost to people who are the same age)
            - 10 points for age match
                - -1 point for each year of age difference
                - (age difference * 2) is subtracted if age difference is greater than 10

            (too resource intensive to calculate distance for every user, so we'll give a slight boost to people who are in the same town)
            - 5 points for being in the same town

            - 5 points for having the same job title
            - 5 points for working at the same company
            - 20 points (10 point bonus) for working at the same company and having the same job position
    */

    users.forEach( (user) => {
        // the things we care about: age similarity (10 points for match, -1 for each age different), interest matching (10 points per match)
        user['score'] = 0; // initialize the score to 0

        // if the other user has sent a like to the session user, give them a *big boost*
        if (user?.likes?.includes(sessionUser.userId)) {
            user['score'] += 50;
        }

        // age similarity - we don't *really* care about age due to age filtering, but this is a good way to give a slight boost to people who are the same age
        const ageDifference = Math.abs(calculateAge(sessionUser) - calculateAge(user));
        if (ageDifference < 10) {
            user['score'] -= ageDifference;
        } else {
            user['score'] -= ageDifference * 2;
        }

        // interest matching - 10 points per common interest
        const combinedInterests = new Set([sessionUser.primary_interest, sessionUser.secondary_interest, sessionUser.third_interest, user.primary_interest, user.secondary_interest, user.third_interest]);

        user['score'] += combinedInterests.size < 3 ? combinedInterests.size * 10 : 50; // bonus if all 3 interests match

        // again, we don't *really* care about location due to location filtering, but we'll give 5 points if they're in the same town to give a boost to people who we know are close to the user without having to calculate distance again
        if (sessionUser.location === user.location) {
            user['score'] += 5;
        }

        // in similar fashion, if they work at the same company or have the same job position, we'll give another quick win, with a boost to people who work at the same company and have the same job position
        if ((sessionUser.job_position === user.job_position) && (sessionUser.job_company === user.job_company)) {
            user['score'] += 20;
        }

        else if (sessionUser.job_company === user.job_company) {
            user['score'] += 5;
        }

        else if (sessionUser.job_position === user.job_position) {
            user['score'] += 5;
        }
    });

    // sort the array by score
    users.sort((a, b) => b['score'] - a['score']);
    return users;
}
