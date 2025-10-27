import { useMemo } from 'react';
import { Line, Group } from 'react-konva';
import * as Constants from '../../Constants';

export interface Connection {
  fromx: number;
  fromy: number;
  tox: number;
  toy: number;
  oneWay: boolean;
}

export default function Connections({ connections }: { connections: Connection[] }) {
    const buildConnections = (connections: Connection[]) => {
        var lines = [];
        if (connections) {
           for (let i = 0; i < connections.length; i++) {
              const { fromx, fromy: rawFromY, tox, toy: rawToY, oneWay } = connections[i];
              const fromy = rawFromY - Constants.WORLD_RADIUS / 2;
              const toy = rawToY - Constants.WORLD_RADIUS / 2;

              if (!oneWay) {
                const line = (
                  <Line
                    points={[fromx, fromy, tox, toy]}
                    key={`conn-${i}`}
                    stroke={Constants.CONNECTION_COLOR}
                    shadowEnabled={false}
                    listening={false}
                  />
                );
                lines.push(line);
              } else {
                const mx = fromx + (tox - fromx) / 2;
                const my = fromy + (toy - fromy) / 2;

                const solidHalf = (
                  <Line
                    points={[fromx, fromy, mx, my]}
                    key={`conn-${i}-solid`}
                    stroke={Constants.CONNECTION_COLOR}
                    shadowEnabled={false}
                    listening={false}
                  />
                );

                const dottedHalf = (
                  <Line
                    points={[mx, my, tox, toy]}
                    key={`conn-${i}-dotted`}
                    stroke={Constants.CONNECTION_COLOR}
                    shadowEnabled={false}
                    listening={false}
                    dash={[6, 6]}
                  />
                );

                lines.push(solidHalf, dottedHalf);
              }
           }
       }
       return lines;
    }

    const lines = useMemo(() => buildConnections(connections), [connections]);

    return (
          <Group listening={false}>{lines}</Group>
    );
}