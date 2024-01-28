import calculateAge from "./calculateAge";

export default function scoringAlgorithm(sessionUser: any, users: any[]) {
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
    });

    // sort the array by score
    users.sort((a, b) => b['score'] - a['score']);
    return users;
}
