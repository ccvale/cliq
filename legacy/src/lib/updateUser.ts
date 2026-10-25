export default async function updateUser(url: any, data: any) {
    
    /*
        NAME

            updateUser - function called to update the user information in database

        SYNOPSIS

            updateUser(url, data)
            - url (string): is used with the trigger to specify the path of
            - data (any) The data to be sent to the server on API call

        DESCRIPTION
        
        Function called to update the user information in database - specifically called when the user updates their profile information.
        We use the PATCH method to update the user information in the database, since we are only updating the user information and not creating a new user.
            
    */

    // needed to identify user, but shouldn't be sent through the call
    const id = data['arg']['id'];

    // which is why we delete it from the payload
    if (id) {
        delete data['arg']['id'];
    }

    const options: RequestInit = {
        method: 'PATCH', // since we want to *update* the user information
        headers: { Authorization: process.env.NEXT_PUBLIC_XATA_BEARER || '', 'Content-Type': 'application/json' },
        body: JSON.stringify(data['arg']) // converting the data to proper JSON format
    };

    fetch(`https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/Users/data/${id}?columns=id`, options)
        .then(response => response.json())
        .catch(err => console.error(err));
}