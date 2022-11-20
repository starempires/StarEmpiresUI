import React from 'react';
import Konva from 'konva';
import { RegularPolygon } from 'react-konva';
import * as Constants from './Constants';

export default function Hex(props) {

    return (
        <RegularPolygon
            x={props.x}
            y={props.y}
            sides={6}
            radius={Constants.RADIUS}
            rotation={30}
            fill={props.color}
        />
    );
}