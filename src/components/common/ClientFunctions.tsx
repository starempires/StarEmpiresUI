import type { Schema } from '../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

const client = generateClient<Schema>({ authMode: 'userPool' });

export async function registerEmpire(
    sessionName: string,
    playerName: string,
    empireName: string,
  ): Promise<any> {
    const result = await client.models.Empire.create({
              name: empireName,
              playerName: playerName,
              sessionName: sessionName,
              ordersLocked: false,
              empireType: 'ACTIVE'
    });
    return result.data;
}