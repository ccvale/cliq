// This is where a majority of the remaining logic for early generated test data is stored...these are no longer used

export const paletteOptions: string[] = ['Slate', 'Orange', 'Gray', 'Yellow', 'Zinc', 'Green', 'Neutral', 'Blue', 'Stone', 'Indigo', 'Red', 'Purple', 'Pink', 'Amber', 'Cyan', 'Violet', 'Lime', 'Rose', 'Teal'];

export type User = {
    name: string,
    age: number,
    position?: string,
    positionAt?: string,
    bio?: string,
    location?: string,
    interests?: string[],
    palette: string[],
}

export const interestOptions: string[] = [
    'Basketball', 'Football', 'Soccer', 'Baseball', 'Hockey',
    'Golf', 'Tennis', 'Volleyball', 'Running', 'Swimming',
    'Cycling', 'Hiking', 'Skiing', 'Snowboarding', 'Skateboarding',
    'Surfing', 'Yoga', 'Pilates', 'Weightlifting', 'Crossfit',
    'Parkour', 'Martial Arts', 'Dancing', 'Cooking', 'Baking',
    'Gardening', 'Painting', 'Drawing', 'Sculpting', 'Photography',
    'Singing', 'Playing an Instrument', 'Writing', 'Reading',
    'Watching Movies', 'Watching TV', 'Video Games', 'Board Games'
];
