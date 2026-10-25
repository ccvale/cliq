export default async function addMessage(url: string, data: any) {
    
    /*
        NAME

            addMessage - function called to add a new message to the database

        SYNOPSIS

            addMessage(url, data)
            - url (string): is used with the trigger to specify the path of
            - data (any) The data to be sent to the server on API call

        DESCRIPTION
        
        Function called to add a new message to the database - specifically called when the user sends a new message.
        We use the POST method to add the new message to the database, since we are creating a new message and not updating an existing one.
        On message send, we call this function to add the message to the database, while simultaneously updating the message list in the UI.

        The function returns a JSON object containing the new message, and a confirmation that the message was added to the database.
            
    */
    const options = {
        method: 'POST',
        headers: {
            Authorization: process.env.NEXT_PUBLIC_XATA_BEARER || '', // typescript again...this is given to us, and will never be undefined but it's not happy
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data['arg'])
    };

    fetch('https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/messages/data', options)
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}