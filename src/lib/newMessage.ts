export default async function addMessage(url: string, data: any) {
    const options = {
        method: 'POST', // Change to POST for adding a new entry
        headers: {
            Authorization: 'Bearer xau_9RD7mvkOgZ1L4WGnagqll6rBdvOWJim81',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data['arg']) // Payload should contain the message data
    };

    fetch('https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/messages/data', options) // Change the URL to point to the messages table
        .then(response => response.json())
        .then(response => console.log(response))
        .catch(err => console.error(err));
}