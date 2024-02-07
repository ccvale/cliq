export default async function getMatches(id: string) {
    
    /*
        NAME

            getMatches - function called to get the matches for the user

        SYNOPSIS

            getMatches(url, data)
            - id (string): the id of the user whose matches we want to retrieve

        DESCRIPTION
        
        In instances where we want to make a quick call to the database to get the matches for the user on the client side, we call this function.
        We use the GET method to retrieve the matches for the user, since we are not creating or updating any data.
        This function is called when the user heads over to the chat page, and we want to display their matches.
        This allows us to fetch the matches for the user and display them in the UI later on.

        We also make this call when we are dealing with unmatches, and we want to update the matches for the user, to reflect the unmatch.

        The function returns a JSON object containing the matches for the user, and data about the matches that are used further down the line.
            
    */
    
    const options = {
        method: 'GET',
        headers: {
            Authorization: 'Bearer xau_9RD7mvkOgZ1L4WGnagqll6rBdvOWJim81', // typescript again...this is given to us, and will never be undefined but it's not happy
            'Content-Type': 'application/json'
        },
    };

    try {
        const response = await fetch(`https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/Users/data/${id}`, options);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const jsonResponse = await response.json();
        return jsonResponse;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
