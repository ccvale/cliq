interface User {
    age: number;
    position: string;
    location: string;
    interests: string[];
}

function calculateSimilarity(user1: User, user2: User): number {
    // Define weights for different features
    const weights: { [key: string]: number } = {
        age: 0.2,
        position: 0.3,
        location: 0.3,
        interests: 0.2
    };

    // Calculate similarity for each feature
    const ageSimilarity: number = 1 - Math.abs(user1.age - user2.age) / Math.max(user1.age, user2.age);

    const positionSimilarity: number = user1.position === user2.position ? 1 : 0;

    const locationSimilarity: number = user1.location === user2.location ? 1 : 0;

    // Calculate interests similarity using Jaccard similarity coefficient
    const interestsIntersection: number = user1.interests.filter(interest => user2.interests.includes(interest)).length;
    const interestsUnion: number = new Set([...user1.interests, ...user2.interests]).size;
    const interestsSimilarity: number = interestsUnion !== 0 ? interestsIntersection / interestsUnion : 0;

    // Calculate overall similarity using weighted sum
    const totalSimilarity: number =
        weights.age * ageSimilarity +
        weights.position * positionSimilarity +
        weights.location * locationSimilarity +
        weights.interests * interestsSimilarity;

    return totalSimilarity;
}

// Example usage
const user1: User = {
    age: 25,
    position: 'Software Engineer',
    location: 'CityA',
    interests: ['programming', 'travel', 'reading']
};

const user2: User = {
    age: 27,
    position: 'Software Engineer',
    location: 'CityA',
    interests: ['programming', 'sports', 'reading']
};

const similarityScore: number = calculateSimilarity(user1, user2);
console.log(`Similarity score: ${similarityScore}`);