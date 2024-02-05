import { UsersRecord } from './src/xata';
//This file is where additional types outside of the generated types from our database are stored - there are instances where we want to use a subset of this data, or we want to use a different type of data than what is generated from the database - this is where we store that data

import UsersRecord from './src/xata';

export type SettingsFormData = {
    display_name: string | JSONData,
    id: string | JSONData,
    bio: string | JSONData,
    gender: string | JSONData,
    location: string | JSONData,
    job_position: string | JSONData,
    job_company: string | JSONData,
    birthday: string | JSONData,
    primary_palette: string | JSONData,
    secondary_palette: string | JSONData,
    primary_interest: string | JSONData,
    secondary_interest: string | JSONData,
    third_interest: string | JSONData,
    age_filter: [string | JSONData, string | JSONData],
    location_filter: [string | JSONData, string | JSONData]
}

export interface ExtendedUser extends UsersRecord {
    image: string | undefined,
    cardTheme: string | undefined
}



//
//
//
// The following is remaining setup code for the test user data...this is not used in the production, or anymore, but is here for reference
//
//
//

export const paletteOptions: string[] = ['Slate', 'Orange', 'Gray', 'Yellow', 'Zinc', 'Green', 'Neutral', 'Blue', 'Stone', 'Indigo', 'Red', 'Purple', 'Pink', 'Amber', 'Cyan', 'Violet', 'Lime', 'Rose', 'Teal'];

export type TestUser = {
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
