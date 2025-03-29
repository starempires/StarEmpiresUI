import { Group, Circle } from 'react-konva';
import * as Constants from '../../Constants';

export default function Portal({x, y, collapsed}: {x: number; y: number; collapsed: boolean}) {

    return (
       <Group listening={false}>
               {!collapsed && <Circle
                   x={x}
                   y={y - Constants.WORLD_RADIUS/2}
                   radius={Constants.WORLD_RADIUS}
                   stroke={Constants.PORTAL_COLOR}
                   shadowEnabled={false}
                   listening={false}
                 />}
               {!collapsed && <Circle
                   x={x}
                   y={y - Constants.WORLD_RADIUS/2}
                   radius={Constants.WORLD_RADIUS/1.5}
                   stroke={Constants.PORTAL_COLOR}
                   shadowEnabled={false}
                   listening={false}
                 />}
               <Circle
                   x={x}
                   y={y - Constants.WORLD_RADIUS/2}
                   radius={Constants.WORLD_RADIUS/3}
                   stroke={Constants.PORTAL_COLOR}
                   shadowEnabled={false}
                   listening={false}
                 />
       </Group>
    );
}