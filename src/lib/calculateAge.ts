export default function calculateAge(user) {
    /*
        NAME

            calculateAge - calculates the age of the user

        SYNOPSIS

            calculateAge(user)
                - user: JSON object - the user whose age is being calculated

        DESCRIPTION

            This function will calculate the age of the user.
            It will return the age of the user.
    */

    const today = new Date();
    const birthday = new Date(user.birthday);
    let ageThisYear = today.getFullYear() - birthday.getFullYear();

    // Adjust age if the user hasn't had their birthday yet this year
    if (today < new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate())) {
        ageThisYear--;
    }
    return ageThisYear;
}