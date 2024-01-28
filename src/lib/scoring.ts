import calculateAge from "./calculateAge";

export default function scoringAlgorithm(sessionUser: any, users: any[]) {
    /*
        NAME

            scoringAlgorithm - calculates a relevance score for each user

        SYNOPSIS

            scoringAlgorithm(sessionUser, users)
                - sessionUser: JSON object - the user who is currently logged in
                - users: array of JSON objects - the filtered users to score

        DESCRIPTION

            This function calculates a very simple/basic relevance score for each user. Deciding factors include age similarity, interest similarity, with extra points to those in the same town, work at the same company, or have the same job position. The score is calculated by adding points for each similarity and subtracting points for each difference. This orders the users by "relevance" and allows us to display the most relevant users first.
    */

    users.forEach( (user) => {
        // the things we care about: age similarity (10 points for match, -1 for each age different), interest matching (10 points per match)
        user['score'] = 0; // initialize the score to 0

        // age similarity - we don't *really* care about age due to age filtering, but this is a good way to give a slight boost to people who are the same age
        const ageDifference = Math.abs(calculateAge(sessionUser) - calculateAge(user));
        if (ageDifference === 0) {
            user['score'] += 10;
        } else {
            user['score'] -= ageDifference;
        }

        // interest matching
        const interests = [user['primary_interest'], user['secondary_interest'], user['third_interest']];
        const sessionInterests = [sessionUser['primary_interest'], sessionUser['secondary_interest'], sessionUser['third_interest']];

        // iterate through the interests and compare them
        interests.forEach(interest => {
            if (sessionInterests.includes(interest)) {
                user['score'] += 10;
            }
        });

        // again, we don't *really* care about location due to location filtering, but we'll give 5 points if they're in the same town to give a boost to people who we know are close to the user without having to calculate distance again
        if (sessionUser.location === user.location) {
            user['score'] += 5;
        }

        // in similar fashion, if they work at the same company or have the same job position, we'll give another quick win
        if (sessionUser.job_company === user.job_company) {
            user['score'] += 5;
        }

        if (sessionUser.job_position === user.job_position) {
            user['score'] += 5;
        }

    });

    // sort the array by score
    users.sort((a, b) => b['score'] - a['score']);
    return users;
}
