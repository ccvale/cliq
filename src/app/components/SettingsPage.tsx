'use client'

import React, { useEffect, useState } from 'react';
import { UsersRecord } from '@/xata';
import { JSONData } from '@xata.io/client';
import updateUser from '../../lib/updateUser';
import useSWRMutation from 'swr/mutation'
import { SettingsFormData } from '../../../types';
//import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import Autocomplete from "react-google-autocomplete";

/* I tried to use these 'options' in types.d.ts, but it was causing a lot of issues, so I'm just going to leave them here for now */

// these are the color options for the palette - all tailwind compatible colors 
export const paletteOptions = ['Slate', 'Orange', 'Gray', 'Yellow', 'Zinc', 'Green', 'Neutral', 'Blue', 'Stone', 'Indigo', 'Red', 'Purple', 'Pink', 'Amber', 'Cyan', 'Violet', 'Lime', 'Rose', 'Teal'];

// would add more of these in a real app, but since this is a project, I'm just going to leave it at this selection
export const interestOptions = ['Art', 'Business', 'Education', 'Entertainment', 'Fashion', 'Finance', 'Food', 'Health', 'History', 'Lifestyle', 'Music', 'News', 'Politics', 'Science', 'Sports', 'Technology', 'Travel', 'Video Games', 'Yoga', 'Writing', 'Working Out', 'Gardening', 'TV', 'Singing', 'Fishing'];

interface props {
    record: JSONData<UsersRecord>;
}

const libraries = ["places"];

export default function SettingsPage({ record }: props) {
    /*
        NAME

            SettingsPage - Component that renders the logic of the settings page

        SYNOPSIS

            SettingsPage({ record, cid })
                - record: JSONData<UsersRecord> - the record of the session user

        DESCRIPTION

            This component defines the logic for the settings page. It is rendered in the settings page.
            It uses the record and cid props to display the current user's information and allows them to update it via the form.
    */
    
    const { trigger } = useSWRMutation('/api/updateUser', updateUser);

    // the following lines are used to set the initial values of the form fields, and control state when the user updates them:

    const [showPopup, setShowPopup] = useState(false); // state to control the popup that displays when the user updates their settings

    // the following lines are used to set the initial values of the form fields, and control state when the user updates them:
    const [displayName, setDisplayName] = useState(record.display_name ?? '');
    const [bio, setBio] = useState(record.bio ?? '');
    const [gender, setGender] = useState(record.gender ?? '');
    const [location, setLocation] = useState(record.location ?? '');
    const [jobPosition, setJobPosition] = useState(record.job_position ?? '');
    const [jobCompany, setJobCompany] = useState(record.job_company ?? '');

    const [primaryPalette, setPrimaryPalette] = useState(record.primary_palette ?? '');
    const [secondaryPalette, setSecondaryPalette] = useState(record.secondary_palette ?? '');

    const [primaryInterest, setPrimaryInterest] = useState(record.primary_interest ?? '');
    const [secondaryInterest, setSecondaryInterest] = useState(record.secondary_interest ?? '');
    const [thirdInterest, setThirdInterest] = useState(record.third_interest ?? '');
    

    // typescript quirk, converting and checking for types in strange ways...used for calculating and setting the user's age from their birthday
    const userBirthDay = record?.birthday && typeof record.birthday !== 'object' ? new Date(record.birthday).getDate() : 1;
    const userBirthMonth = record?.birthday ? new Date(String(record.birthday)).getMonth() : 0;
    const userBirthYear = record?.birthday && typeof record.birthday !== 'object' ? new Date(record.birthday).getFullYear() : 1900;

    // and the states to allow them to be modified
    const [useUserBirthDay, setUserBirthDay] = useState(userBirthDay);
    const [useUserBirthMonth, setUserBirthMonth] = useState(userBirthMonth);
    const [useUserBirthYear, setUserBirthYear] = useState(userBirthYear);

    // logic to set the initial values of the age and location range sliders; this is also in part based on the user age (over or under 18)
    const defaultAgeRange = { lower: 18, upper: 100 };
    const defaultLocationRange = 100;
    const initialAgeRange = Array.isArray(record.age_filter) ? { lower: parseInt(record.age_filter[0]), upper: parseInt(record.age_filter[1]) } : defaultAgeRange;
    const initialLocationRange = Array.isArray(record.location_filter) ? Math.min(parseInt(record.location_filter[1]), 100) : defaultLocationRange;

    const [ageRange, setAgeRange] = useState(initialAgeRange);
    const [locationRange, setLocationRange] = useState(initialLocationRange);
    

    // handles age logic: calculates user age, and sets it. also, if user is under 18, set the age range to 12-17
    const userAge = record.birthday ? new Date().getFullYear() - new Date(String(record.birthday)).getFullYear() : 0;
    useEffect(() => {
        if (userAge < 18) {
            setAgeRange({ lower: 12, upper: 17 });
        }
    }, [userAge]);

    if (!record || !record.birthday) {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        
        /*
            NAME

                handleSubmit - handles the submission of the form

            SYNOPSIS

                handleSubmit(e)
                    - e: React.FormEvent - the event of submitting the form

            DESCRIPTION

                This function is called when the user submits the form. It updates the user's information in the database.
                It is an async function, and uses the trigger function from the useSWRMutation hook to update the user's information.
                It also displays a popup to the user to let them know that their settings have been updated successfully.
        */

        e.preventDefault();
        
        // this consists of all the possible fields that the user can update, and their values - if these are not updated, we just use the default values, or the preexisting ones
        const updatedData: SettingsFormData = {
            display_name: displayName,
            id: record.id,
            bio: bio,
            gender: gender,
            location: location,
            job_position: jobPosition,
            job_company: jobCompany,
            birthday: new Date(useUserBirthYear, useUserBirthMonth, useUserBirthDay).toISOString(),
            primary_palette: primaryPalette,
            secondary_palette: secondaryPalette,
            primary_interest: primaryInterest,
            secondary_interest: secondaryInterest,
            third_interest: thirdInterest,
            age_filter: [ageRange['lower'].toString(), ageRange['upper'].toString()],
            location_filter: locationRange === 100 ? ['0', '9999999'] : ['0', locationRange.toString()]
        };

        try {
            const result = await trigger(updatedData); // causes blue squiggle, but this is literally the right way to use this
            setShowPopup(true);

            setTimeout(() => {
                setShowPopup(false); // hides the popup after 1 second
                window.location.reload(); // refreshes the page
            }, 1000);
        } catch (error) {
            console.error('Error updating profile:', error);
        }
    }

    // logic here: on submit, we show a popup to the user to let them know their settings have been updated successfully
    // we are also displaying the form, which is composed of many elements, including text inputs, select inputs, and range inputs
    // on default, we show their set values or default values, which is for the user to interact with, and submit into our database
    return (
        <>
        {showPopup && (
            <div className={`absolute top-0 left-0 right-0 bg-gradient-to-r from-${record.primary_palette?.toString().toLowerCase()}-500 to-${record.secondary_palette?.toString().toLowerCase()}-300 text-white font-semibold p-4 text-center`}>
                Settings Updated Successfully!
            </div>
        )}

        <div className="mt-0 mx-auto mb-10 max-w-5xl">
            <form onSubmit={handleSubmit} className={`mt-0 max-w-5xl max-h-[80vh] overflow-y-auto bg-gradient-to-r from-${record.primary_palette?.toString().toLowerCase()}-500 to-${record.secondary_palette?.toString().toLowerCase()}-300 text-white rounded-xl p-10 flex flex-col justify-start items-center mx-auto mb-10 drop-shadow-lg text-center font-semibold`}>
                <h1 className="text-4xl mb-4 -mt-5">User Settings <span className="italic text-lg">Let everyone know who you are!</span></h1>
                <div className="w-full mb-4">
                    <label className="block text-xl mb-2">Display Name <span className="italic text-sm">- How you want to introduce yourself</span>
                        <input type="text" value={displayName.toString()} onChange={(e) => setDisplayName(e.target.value)} className="text-sm text-indigo-400 w-full p-2 rounded" />
                    </label>
                </div>

                <div className="w-full mb-4">
                    <label className="block text-xl mb-2">Bio <span className="italic text-sm">- What do you want others to know about you?</span>
                        <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} className="text-sm text-indigo-400 w-full p-2 rounded h-20" />
                    </label>
                </div>

                <div className="w-full mb-4">
                    <label className="block text-xl mb-2">Gender <span className="italic text-sm">- How do you identify?</span>
                        
                        <select value={gender.toString()} onChange={(e) => setGender(e.target.value)} className="text-sm text-indigo-400 w-full p-2 rounded">

                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>

                    </label>
                </div>

                    <div className="w-full mb-4">
                        <label className="block text-xl mb-2">Location <span className="italic text-sm">- Where are you checking in from?</span>
                            
                        </label>
                    </div>


                <div className="w-full mb-4">
                    <label className="block text-xl mb-2">Current Gig <span className="italic text-sm">- (ex. Student at Duke, Data Scientist at Meta)</span>
                        
                        <div className="flex space-x-2">
                            <input type="text" defaultValue={jobPosition.toString()} onChange={(e) => setJobPosition(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded" />
                            
                            <input type="text" defaultValue={jobCompany.toString()} onChange={(e) => setJobCompany(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded" />
                        </div>
                    </label>
                </div>

                <div className="w-full mb-4">

                    <h1 className="text-xl text-white mb-2">Birthday <span className="italic text-sm">- When were you born?</span></h1>

                    <div className="flex space-x-2 justify-center">
                        <select className="text-sm text-indigo-400 bg-white p-2 rounded" name="birthDay" value={useUserBirthDay} onChange={(e) => setUserBirthDay(Number(e.target.value))}>
                            {[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                        </select>

                        <select className="text-sm text-indigo-400 bg-white p-2 rounded" name="birthMonth" value={useUserBirthMonth} onChange={(e) => setUserBirthMonth(Number(e.target.value))}>
                            {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                                .map((month, index) => <option key={index} value={index + 1}>{month}</option>)}
                        </select>

                        <select className="text-sm text-indigo-400 bg-white p-2 rounded" name="birthYear" value={useUserBirthYear} onChange={(e) => setUserBirthYear(Number(e.target.value))}>
                            {[...Array(new Date().getFullYear() - 1899)].map((_, i) => <option key={i} value={i + 1900}>{i + 1900}</option>)}
                        </select>
                    </div>
                </div>

                <div className="w-full mb-4">
                    <label className="block text-xl mb-2">Interests <span className="italic text-sm">- Select your three most passionate interests</span>
                        
                        <div className="flex space-x-2">
                            <select value={primaryInterest.toString()} onChange={(e) => setPrimaryInterest(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                                {interestOptions.filter(interest => interest !== secondaryInterest && interest !== thirdInterest).map((interest, index) => (
                                    <option key={index} value={interest}>{interest}</option>
                                ))}
                            </select>

                            <select value={secondaryInterest.toString()} onChange={(e) => setSecondaryInterest(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                                {interestOptions.filter(interest => interest !== primaryInterest && interest !== thirdInterest).map((interest, index) => (
                                    <option key={index} value={interest}>{interest}</option>
                                ))}
                            </select>

                            <select value={thirdInterest.toString()} onChange={(e) => setThirdInterest(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                                {interestOptions.filter(interest => interest !== primaryInterest && interest !== secondaryInterest).map((interest, index) => (
                                    <option key={index} value={interest}>{interest}</option>
                                ))}
                            </select>
                        </div>
                    </label>
                </div>

                <div className="w-full mb-4">
                    <label className="block text-xl mb-2">Palette <span className="italic text-sm">- How do you want your profile to look to others?</span>
            
                        <div className="flex space-x-2">
                            <select value={primaryPalette.toString()} onChange={(e) => setPrimaryPalette(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                                {paletteOptions.map((color, index) => (
                                    <option key={index} value={color}>{color}</option>
                                ))}
                            </select>

                            <select value={secondaryPalette.toString()} onChange={(e) => setSecondaryPalette(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                                {paletteOptions.map((color, index) => (
                                    <option key={index} value={color}>{color}</option>
                                ))}
                            </select>
                        </div>
                    </label>
                </div>

                <div className="w-full mb-4">
                    <label className="block text-xl mb-2 text-white">Age Range <span className="italic text-sm">- Select your preferred age range</span>
                        <div className="flex justify-between items-center">
                            <span className="mx-2 text-white text-sm">{ageRange.lower}</span>

                            <input
                                type="range"
                                min={userAge >= 18 ? 18 : 13}
                                max={userAge >= 18 ? ageRange.upper : 17} // Max is 17 if user is under 18
                                value={ageRange.lower}
                                onChange={(e) => {
                                    const newLowerValue = parseInt(e.target.value);
                                    setAgeRange({
                                        ...ageRange,
                                        lower: newLowerValue < ageRange.upper ? newLowerValue : ageRange.upper // Ensure lower value is not more than upper value
                                    });
                                }}
                                className="text-sm range-slider-thumb w-1/2 p-2 rounded accent-indigo-500"
                            />

                            <input
                                type="range"
                                min={userAge >= 18 ? 18 : 13}
                                max={userAge >= 18 ? 100 : 17} // Max is 17 if user is under 18
                                value={ageRange.upper}
                                onChange={(e) => {
                                    const newUpperValue = parseInt(e.target.value);
                                    setAgeRange({
                                        ...ageRange,
                                        upper: newUpperValue > ageRange.lower ? newUpperValue : ageRange.lower // Ensure upper value is not less than lower value
                                    });
                                }}
                                className="text-sm range-slider-thumb w-1/2 p-2 rounded accent-indigo-500"
                            />

                            <span className="mx-2 text-white text-sm">{ageRange.upper}</span>
                        </div>
                    </label>
                </div>
                    
                    <div className="w-full mb-4">
                    <label className="block text-xl mb-2 text-white">Location Range <span className="italic text-sm">- Set your maximum location range in miles</span>
                        
                            <div className="flex justify-between items-center">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={locationRange}
                                    onChange={(e) => setLocationRange(parseInt(e.target.value))}
                                    className="text-sm range-slider-thumb w-full p-2 rounded accent-indigo-500"
                            />
                            
                                <span className="mx-2 text-white text-sm">{locationRange === 100 ? '100+ miles' : `${locationRange} miles`}</span>
                            </div>
                        </label>
                    </div>
                    
                <button type="submit" className="text-xl bg-gray-50 text-indigo-400 px-4 py-2 rounded-lg hover:bg-gray-100 -mt-3">
                    Update Profile
                </button>
            </form>
        </div>
        </>
    );
}
