import { useMemo } from 'react';
import { Line, Group } from 'react-konva';
import * as Constants from '../../Constants';

export default function Connections({ connections }: { connections: number[][] }) {
    const buildConnections = (connections: number[][]) => {
        var lines = [];
        if (connections) {
           for (var i = 0; i < connections.length; i++) {
                var [fromx, fromy, tox, toy] = connections[i];
                fromy = fromy - Constants.WORLD_RADIUS/2;
                toy = toy - Constants.WORLD_RADIUS/2;

                const line =
                      <Line points={[fromx,fromy,tox,toy] }
                               key = {i}
                                    stroke={Constants.CONNECTION_COLOR}
                                    shadowEnabled={false}
                                    listening={false}
                                />
                lines.push(line);
           }
       }
       return lines;
    }

    const lines = useMemo(() => buildConnections(connections), [connections]);

    return (
          <Group listening={false}>{lines}</Group>
    );
}