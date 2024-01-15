import { NextApiRequest, NextApiResponse } from 'next';
import { getXataClient, UsersRecord } from '@/xata';
import { auth } from '@clerk/nextjs';

export async function POST(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { userId } = auth();
        console.log(userId);
        const xata = getXataClient();
        const data = req.body as UsersRecord;
        console.log(data.toString());

        // Assuming 'userId' should be part of the data object
        const payload = {
            ...data,
            userId: userId // Add the userId to the payload
        };

        const options = {
            method: 'PATCH',
            headers: { Authorization: 'Bearer xau_9RD7mvkOgZ1L4WGnagqll6rBdvOWJim81', 'Content-Type': 'application/json' },
            body: JSON.stringify(payload) // Convert the payload to a JSON string
        };

        fetch(`https://chris-valente-s-workspace-18lhf4.us-east-1.xata.sh/db/click:main/tables/Users/data/rec_clr0qgdtlal67q5dnvmg?columns=id`, options)
            .then(response => response.json())
            .then(response => console.log(response))
            .catch(err => console.error(err));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

