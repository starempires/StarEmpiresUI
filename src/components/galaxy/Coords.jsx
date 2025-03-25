import React from 'react';
import { Text} from 'react-konva';
import * as Constants from '../../Constants.jsx';

export default function Coords(props) {

    const element = document.createElement('canvas');
    const context = element.getContext("2d");
    context.font=Constants.COORDS_FONT_SIZE + "px " + Constants.COORDS_FONT_FAMILY;
    const size = context.measureText(props.text);
    const textWidth = size["width"];

    return (
             <Text
                   x={props.x - textWidth/2}
                   y={props.y + Constants.RADIUS - (Constants.COORDS_FONT_SIZE *1.6) }
                   stroke={props.color}
                   fill={props.color}
                   align="center"
                   strokeWidth={0.3}
                   text={props.text} fontSize={Constants.COORDS_FONT_SIZE} fontFamily={Constants.COORDS_FONT_FAMILY}
             />
    );
}