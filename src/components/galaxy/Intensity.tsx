import {Text} from 'react-konva';
import * as Constants from '../../Constants';

export default function Intensity({x, y, text} : {x: number; y: number; text: string}) {

    const element = document.createElement('canvas');
    const context = element.getContext("2d");

    if (!context) {
        return null;
    }

    const color = Constants.BORDER_TYPE_COLOR_MAP.get(Constants.BORDER_TYPE.Storm);
    context.font=Constants.WORLD_RADIUS + "px " + Constants.COORDS_FONT_FAMILY;

    return (
             <Text
                   x={x - Constants.RADIUS + Constants.SHORT_SIDE/2}
                   y={y - Constants.INTENSITY_FONT_SIZE /2}
                   stroke={color}
                   fill={color}
                   align="center"
                   listening={false}
                   strokeWidth={0.3}
                   text={text} fontSize={Constants.WORLD_RADIUS} fontFamily={Constants.COORDS_FONT_FAMILY}
             />
    );
}