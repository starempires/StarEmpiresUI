import React from 'react';
import { RegularPolygon } from 'react-konva';
import * as Constants from '../../Constants';

export default function Border(props) {
       return (
          <RegularPolygon
              x={props.x}
              y={props.y}
              sides={6}
              radius={props.type !== Constants.BORDER_TYPE.Regular ? Constants.RADIUS -1 : Constants.RADIUS}
              rotation={30}
              stroke={Constants.BORDER_TYPE_COLOR_MAP.get(props.type)}
              strokeWidth={props.type !== Constants.BORDER_TYPE.Regular ? 2 : 1}
          />
    );
}