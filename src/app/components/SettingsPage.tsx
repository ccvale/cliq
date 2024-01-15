'use client'
import React, { use, useEffect, useState } from 'react';
import { UsersRecord, XataClient, getXataClient } from '@/xata';
import { JSONData } from '@xata.io/client';
import updateUser from '../../lib/updateUser';
// import SubmitButton from './SubmitButton';
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'



interface MyComponentProps {
    record: JSONData<UsersRecord>,
    cid: string
}

const paletteOptions = ['Slate', 'Orange', 'Gray', 'Yellow', 'Zinc', 'Green', 'Neutral', 'Blue', 'Stone', 'Indigo', 'Red', 'Purple', 'Pink', 'Amber', 'Cyan', 'Violet', 'Lime', 'Rose', 'Teal'];

const interestOptions = ['Art', 'Business', 'Education', 'Entertainment', 'Fashion', 'Finance', 'Food', 'Health', 'History', 'Lifestyle', 'Music', 'News', 'Politics', 'Science', 'Sports', 'Technology', 'Travel', 'Other'];

export default function SettingsPage({ record, cid }: MyComponentProps) {
    const { trigger } = useSWRMutation('/api/updateUser', updateUser);
    
    if (!record || !record.birthday) {
        return null;
    }

    const [displayName, setDisplayName] = useState(record.display_name ?? '');
    const [bio, setBio] = useState(record.bio ?? '');
    const [gender, setGender] = useState(record.gender ?? '');
    const [location, setLocation] = useState(record.location ?? '');
    const [jobPosition, setJobPosition] = useState(record.job_position ?? '');
    //const [birthday, setBirthday] = useState(record.birthday ?? '');
    const [jobCompany, setJobCompany] = useState(record.job_company ?? '');

    const userBirthDay = new Date(record.birthday).getDate();
    const userBirthMonth = new Date(record.birthday).getMonth();
    const userBirthYear = new Date(record.birthday).getFullYear();

    const [useUserBirthDay, setUserBirthDay] = useState(userBirthDay);
    const [useUserBirthMonth, setUserBirthMonth] = useState(userBirthMonth);
    const [useUserBirthYear, setUserBirthYear] = useState(userBirthYear);


    const [primaryPalette, setPrimaryPalette] = useState(record.primary_palette ?? '');
    const [secondaryPalette, setSecondaryPalette] = useState(record.secondary_palette ?? '');
    
    const [primaryInterest, setPrimaryInterest] = useState(record.primary_interest ?? '');
    const [secondaryInterest, setSecondaryInterest] = useState(record.secondary_interest ?? '');
    const [thirdInterest, setThirdInterest] = useState(record.third_interest ?? '');
    
    const [ageRange, setAgeRange] = useState({ lower: 18, upper: 100 });
    const [locationRange, setLocationRange] = useState({ lower: 0, upper: 100 }); // 0 to 100 miles away as an example

    const userAge = new Date().getFullYear() - new Date(record.birthday).getFullYear();
    useEffect(() => {
        if (userAge < 18) {
            setAgeRange({ lower: 12, upper: 17 }); // if user is under 18, set the age range to 12-17
        }
    }, [userAge]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const updatedData = {
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
            location_filter: [locationRange['lower'].toString(), locationRange['upper'].toString()],
        };

        console.log(updatedData);
        const result = await trigger(updatedData);
        console.log(result);

        // we want to send this data to the backend without using any server components

    }

    return (
        <form onSubmit={handleSubmit} className="bg-gradient-to-r from-pink-300 to-indigo-400 text-white rounded-xl p-10 flex flex-col justify-center items-center mx-auto mb-10 drop-shadow-lg text-center font-semibold max-w-4xl">
            <h1 className="text-4xl mb-6">User Settings <span className="italic text-lg">Let everyone know who you are!</span></h1>

            <div className="w-full mb-4">
                <label className="block text-xl mb-2">Display Name <span className="italic text-sm">- How you want others to see your name</span>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="text-sm text-indigo-400 w-full p-2 rounded" />
                </label>
            </div>

            <div className="w-full mb-4">
                <label className="block text-xl mb-2">Bio <span className="italic text-sm">- First impressions are everything...leave it all out there</span>
                    <input type="text" value={bio} onChange={(e) => setBio(e.target.value)} className="text-sm text-indigo-400 w-full p-2 rounded h-20" />
                </label>
            </div>

            <div className="w-full mb-4">
                <label className="block text-xl mb-2">Gender <span className="italic text-sm">- How do you identify?</span>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="text-sm text-indigo-400 w-full p-2 rounded">
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </label>
            </div>

            <div className="w-full mb-4">
                <label className="block text-xl mb-2">Location <span className="italic text-sm">- Where are you checking in from?</span>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="text-sm text-indigo-400 w-full p-2 rounded" />
                </label>
            </div>

            <div className="w-full mb-4">
                <label className="block text-xl mb-2">Current Gig <span className="italic text-sm">- (ex. Student at Duke, Data Scientist at Meta)</span>
                    <div className="flex space-x-2">
                        <input type="text" defaultValue={jobPosition} onChange={(e) => setJobPosition(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded" />
                        <input type="text" defaultValue={jobCompany} onChange={(e) => setJobCompany(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded" />
                    </div>
                </label>
            </div>

            <div className="w-full mb-4">
                <h1 className="text-xl text-white mb-2">Birthday <span className="italic text-sm">- When were you born?</span></h1>
                <div className="flex space-x-2 justify-center">
                    <select className="text-sm text-indigo-400 bg-white p-2 rounded" name="birthDay" value={useUserBirthDay} onChange={(e) => setUserBirthDay(e.target.value)}>
                        {[...Array(31)].map((_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
                    </select>
                    <select className="text-sm text-indigo-400 bg-white p-2 rounded" name="birthMonth" value={useUserBirthMonth} onChange={(e) => setUserBirthMonth(e.target.value)}>
                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
                            .map((month, index) => <option key={index} value={index + 1}>{month}</option>)}
                    </select>
                    <select className="text-sm text-indigo-400 bg-white p-2 rounded" name="birthYear" value={useUserBirthYear} onChange={(e) => setUserBirthYear(e.target.value)}>
                        {[...Array(new Date().getFullYear() - 1899)].map((_, i) => <option key={i} value={i + 1900}>{i + 1900}</option>)}
                    </select>
                </div>
            </div>

            <div className="w-full mb-4">
                <label className="block text-xl mb-2">Interests <span className="italic text-sm">- Select your three most passionate interests</span>
                    <div className="flex space-x-2">
                        <select value={primaryInterest} onChange={(e) => setPrimaryInterest(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                            {interestOptions.filter(interest => interest !== secondaryInterest && interest !== thirdInterest).map((interest, index) => (
                                <option key={index} value={interest}>{interest}</option>
                            ))}
                        </select>
                        <select value={secondaryInterest} onChange={(e) => setSecondaryInterest(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                            {interestOptions.filter(interest => interest !== primaryInterest && interest !== thirdInterest).map((interest, index) => (
                                <option key={index} value={interest}>{interest}</option>
                            ))}
                        </select>
                        <select value={thirdInterest} onChange={(e) => setThirdInterest(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
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
                        <select value={primaryPalette} onChange={(e) => setPrimaryPalette(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                            {paletteOptions.map((color, index) => (
                                <option key={index} value={color}>{color}</option>
                            ))}
                        </select>
                        <select value={secondaryPalette} onChange={(e) => setSecondaryPalette(e.target.value)} className="text-sm text-indigo-400 w-1/2 p-2 rounded">
                            {paletteOptions.map((color, index) => (
                                <option key={index} value={color}>{color}</option>
                            ))}
                        </select>
                    </div>
                </label>
                

                <div className="w-full mb-4">
                    <label className="block text-xl mb-2 text-white">Age Range <span className="italic text-sm">- Select your preferred age range</span>
                        <div className="flex justify-between items-center">
                            <span className="mx-2 text-white text-sm">{ageRange.lower}</span>
                            <input
                                type="range"
                                min={userAge >= 18 ? 18 : 12}
                                max={ageRange.upper} // Set the max to the current upper range value
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
                                min={userAge >= 18 ? 18 : 12}
                                max="100"
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
                    <label className="block text-xl mb-2 text-white">Location Range <span className="italic text-sm">- Set your location range in miles</span>
                        <div className="flex justify-between items-center">
                            <span className="mx-2 text-white text-sm">{locationRange.lower} miles</span>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={locationRange.lower}
                                onChange={(e) => setLocationRange({ ...locationRange, lower: parseInt(e.target.value) })}
                                className="text-sm range-slider-thumb w-1/2 p-2 rounded accent-indigo-500"
                            />
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={locationRange.upper}
                                onChange={(e) => {
                                    const newUpperValue = parseInt(e.target.value);
                                    setLocationRange({
                                        ...locationRange,
                                        upper: newUpperValue > locationRange.lower ? newUpperValue : locationRange.lower
                                    });
                                }}
                                className="text-sm range-slider-thumb w-1/2 p-2 rounded accent-indigo-500"
                            />
                            <span className="mx-2 text-white text-sm">{locationRange.upper} miles</span>
                        </div>
                    </label>
                </div>
            </div>

            <button type="submit" className="text-xl bg-gray-50 text-indigo-400 px-4 py-2 rounded-lg hover:bg-gray-100 mt-4">
                Update Profile
            </button>
        </form>
    );
}
