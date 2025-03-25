import React from 'react';
import { Line, Group } from 'react-konva';
import * as Constants from '../../Constants.jsx';

export default function Connections(props) {
    var lines = [];
    for (var i = 0; i < props.connections.length; i++) {
         var [fromx, fromy, tox, toy] = props.connections[i];
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

    return (
          <Group>{lines}</Group>
    );
}