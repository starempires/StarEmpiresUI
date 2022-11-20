import React from 'react';
import Konva from 'konva';
import { Group, Circle } from 'react-konva';
import * as Constants from './Constants';

export default function Portal(props) {

    return (
       <Group listening={false}>
               {!props.collapsed && <Circle
                   x={props.x}
                   y={props.y - Constants.WORLD_RADIUS/2}
                   radius={Constants.WORLD_RADIUS}
                   stroke={Constants.PORTAL_COLOR}
                   shadowEnabled={false}
                   listening={false}
                 />}
               {!props.collapsed && <Circle
                   x={props.x}
                   y={props.y - Constants.WORLD_RADIUS/2}
                   radius={Constants.WORLD_RADIUS/1.5}
                   stroke={Constants.PORTAL_COLOR}
                   shadowEnabled={false}
                   listening={false}
                 />}
               <Circle
                   x={props.x}
                   y={props.y - Constants.WORLD_RADIUS/2}
                   radius={Constants.WORLD_RADIUS/3}
                   stroke={Constants.PORTAL_COLOR}
                   shadowEnabled={false}
                   listening={false}
                 />
       </Group>
    );
}