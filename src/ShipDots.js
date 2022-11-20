import React from 'react';
import Konva from 'konva';
import { Group, Rect } from 'react-konva';
import * as Constants from './Constants';

export default function ShipDots(props) {
    var dots = [];
    var key = 0;
    if (props.unidentifiedShips) {
      var rect = <Rect
                key={key}
                x={props.x - Constants.RADIUS/2 + key * Constants.SHIP_DOT_SIZE}
                y={props.y + Constants.RADIUS/3}
                width={Constants.SHIP_DOT_SIZE}
                height={Constants.SHIP_DOT_SIZE}
                fill={Constants.UNIDENTIFIED_SHIPS_COLOR}
                listening={false}
              />
       dots.push(rect);
       key++;
    }

    for (var i in props.shipDotColors) {
      var rect = <Rect
                key={key}
                x={props.x - Constants.RADIUS/2 + key * Constants.SHIP_DOT_SIZE + key}
                y={props.y + Constants.RADIUS/3}
                width={Constants.SHIP_DOT_SIZE}
                height={Constants.SHIP_DOT_SIZE}
                fill={props.shipDotColors[i]}
                listening={false}
              />
       dots.push(rect);
       key++;
    }

   return key > 0 ? (
          <Group>
            {dots}
          </Group>
         ) : "";
}