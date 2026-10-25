import { UsersRecord } from "@/xata";

export default function calculateAge(user: UsersRecord): number {
    
    /*
        NAME

            calculateAge - calculates the age of the user

        SYNOPSIS

            calculateAge(user)
                - user: UsersRecord - the user whose age is being calculated

        DESCRIPTION

            This function will calculate the age of the user.
            It will return the age of the user.
    */

    const today = new Date();
    const birthday = user.birthday ? new Date(user.birthday) : null;
    let ageThisYear = today.getFullYear() - (birthday ? birthday.getFullYear() : 0);

    // adjust age if the user hasn't had their birthday yet this year
    if (birthday && today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())) {
        ageThisYear--;
    }
    return ageThisYear;
}