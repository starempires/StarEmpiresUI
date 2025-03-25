import React from 'react';
import { RegularPolygon } from 'react-konva';
import * as Constants from '../../Constants.jsx';

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