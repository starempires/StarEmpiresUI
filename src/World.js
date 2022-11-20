import React from 'react';
import Konva from 'konva';
import { Line, Text, Group, Circle } from 'react-konva';
import * as Constants from './Constants';


export default function World (props) {
      const element = document.createElement('canvas');
      const context = element.getContext("2d");
      context.font= Constants.WORLD_RADIUS + "px " + Constants.COORDS_FONT_FAMILY;
      const size = context.measureText(props.production.toString());
      const cos45 = Math.cos(45);
      const sin45 = Math.sin(45);

      const blockadePoints = [
               props.x-Constants.WORLD_RADIUS * cos45 - Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 - Constants.WORLD_RADIUS * sin45 - Constants.PROHIBITION_LINE_OFFSET,
               props.x+Constants.WORLD_RADIUS * cos45 + Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 +Constants.WORLD_RADIUS * sin45 + Constants.PROHIBITION_LINE_OFFSET
      ];
      const interdictionPoints = [
               props.x+Constants.WORLD_RADIUS * cos45 + Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 -Constants.WORLD_RADIUS * sin45 - Constants.PROHIBITION_LINE_OFFSET,
               props.x-Constants.WORLD_RADIUS * cos45 - Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 + Constants.WORLD_RADIUS * sin45 + Constants.PROHIBITION_LINE_OFFSET
      ];
      const prodTextWidth = size["width"];

    return (
       <Group listening={false}>
        <Circle
            x={props.x}
            y={props.y - Constants.WORLD_RADIUS/2}
            radius={Constants.WORLD_RADIUS}
            fill={props.color}
            shadowEnabled={false}
            listening={false}
          />
          {props.border && <Circle
                      x={props.x}
                      y={props.y - Constants.WORLD_RADIUS/2}
                      radius={Constants.WORLD_RADIUS}
                      stroke={Constants.WORLD_BORDER_COLOR}
                      dash={Constants.WORLD_BORDER_DASH_PATTERN}
                      dashEnabled={true}
                      shadowEnabled={false}
                      listening={false}
          />}


          {props.prohibition &&
                <Line points={blockadePoints}
                      stroke={Constants.PROHIBITION_COLOR}
                      shadowEnabled={false}
                      listening={false}
                />}
          {props.prohibition === Constants.PROHIBITION_TYPE.Interdicted &&
                <Line points={interdictionPoints}
                      stroke={Constants.PROHIBITION_COLOR}
                      shadowEnabled={false}
                      listening={false}
                />}
         <Text
          x={props.x - prodTextWidth/2}
          y={props.y - Constants.WORLD_RADIUS }
          stroke={Constants.PRODUCTION_COLOR}
          fill={Constants.PRODUCTION_COLOR}
          align="center"
          strokeWidth={1}
          listening={false}
          shadowEnabled={false}
          text={props.production} fontSize={Constants.WORLD_RADIUS} fontFamily={Constants.COORDS_FONT_FAMILY}
         />
       </Group>
    );
}