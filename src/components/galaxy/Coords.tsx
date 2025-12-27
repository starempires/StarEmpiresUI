import {Text} from 'react-konva';
import * as Constants from '../../Constants';

export default function Coords({x, y, text, color} : {x: number; y: number; text: string, color: string}) {

    const element = document.createElement('canvas');
    const context = element.getContext("2d");

    if (!context) {
        return null;
    }

    context.font=Constants.COORDS_FONT_SIZE + "px " + Constants.COORDS_FONT_FAMILY;
    const size = context.measureText(text);
    const textWidth = size["width"];

    return (
             <Text
                   x={x - textWidth/2}
                   y={y + Constants.RADIUS - (Constants.COORDS_FONT_SIZE * 1.7) }
                   stroke={color}
                   fill={color}
                   align="center"
                   listening={false}
                   strokeWidth={0.4}
                   text={text} fontSize={Constants.COORDS_FONT_SIZE} fontFamily={Constants.COORDS_FONT_FAMILY}
             />
    );
}