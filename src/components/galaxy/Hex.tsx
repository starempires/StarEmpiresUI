import { RegularPolygon } from 'react-konva';
import * as Constants from '../../Constants';

export default function Hex({x, y, color}: {x: number; y: number; color: string}) {

    return (
        <RegularPolygon
            x={x}
            y={y}
            sides={6}
            radius={Constants.RADIUS}
            rotation={30}
            listening={true}
            fill={color}
        />
    );
}