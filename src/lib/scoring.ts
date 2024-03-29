import { UsersRecord } from '@/xata';
import calculateAge from './calculateAge';

// fix the typing for the users array
export default function scoringAlgorithm(sessionUser: UsersRecord, users: UsersRecord[]) {
    
    /*
        NAME

            scoringAlgorithm - calculates a relevance score for each user

        SYNOPSIS

            scoringAlgorithm(sessionUser, users)
                - sessionUser: UsersRecord - the user who is currently logged in
                - users: array of type UsersRecord - the filtered users to score

        DESCRIPTION

            This function calculates a very simple/basic relevance score for each user. Deciding factors include age similarity, interest similarity, with extra points to those in the same town, work at the same company, or have the same job position. Most importantly, a big boost to users who have already liked the session user, and they will have a big chance to get to the top of the session users swipe queue. The score is calculated by adding points for each similarity and subtracting points for each difference. This orders the users by 'relevance' and allows us to display the most relevant users first.

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

    let userScores: { userId: string; score: number; }[] = [];
    users.forEach((user) => {
        // the things we care about: age similarity (10 points for match, -1 for each age different), interest matching (10 points per match)
        let score = 0;

        // if the other user has sent a like to the session user, give them a *big boost*
        if (user?.likes?.includes(sessionUser.userId)) {
            score += 50;
        }

        // age similarity - we don't *really* care about age due to age filtering, but this is a good way to give a slight boost to people who are the same age
        const ageDifference = Math.abs(calculateAge(sessionUser) - calculateAge(user));
        
        if (ageDifference === 0) {
            score += 10;
        }
        else if (ageDifference <= 3) {
            score += 5; // quick win
        }
        else if (ageDifference > 5) {
            score -= ageDifference; // penalty
        }

        // interest matching - 10 points per common interest
        const userInterests = [user.primary_interest, user.secondary_interest, user.third_interest];
        const sessionUserInterests = [sessionUser.primary_interest, sessionUser.secondary_interest, sessionUser.third_interest];

        // intersection of the two arrays
        const combinedInterests = userInterests.filter(interest => sessionUserInterests.includes(interest));

        score += combinedInterests.length < 3 ? combinedInterests.length * 10 : 50; // bonus if all 3 interests match

        // again, we don't *really* care about location due to location filtering, but we'll give 5 points if they're in the same town to give a boost to people who we know are close to the user without having to calculate distance again
        if (sessionUser.location === user.location) {
            score += 5;
        }

        // in similar fashion, if they work at the same company or have the same job position, we'll give another quick win, with a boost to people who work at the same company and have the same job position
        if ((sessionUser.job_position === user.job_position) && (sessionUser.job_company === user.job_company)) {
            score += 20;
        }

        else if (sessionUser.job_company === user.job_company) {
            score += 5;
        }

        else if (sessionUser.job_position === user.job_position) {
            score += 5;
        }

        userScores.push({ userId: user.userId, score: score });
    });

    // sort the array by score
    userScores.sort((a, b) => b.score - a.score);
    const sortedUsers = userScores.map(score => users.find(user => user.userId === score.userId));

    return sortedUsers;
}
