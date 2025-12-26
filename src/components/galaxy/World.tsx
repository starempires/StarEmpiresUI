import { useState, useEffect } from 'react';
import { Line, Text, Group, Circle } from 'react-konva';
import * as Constants from '../../Constants';

const COS45 = Math.cos(45);
const SIN45 = Math.sin(45);

interface WorldProps {
  x: number;
  y: number;
  production: number;
  color: string;
  border?: boolean;
  prohibition?: string; // Adjust this type if you have an enum for prohibition types
}

export default function World (props: WorldProps) {

      const [prodTextWidth, setProdTextWidth] = useState(0);
      const [blockadePoints, setBlockadePoints] = useState<number[]>([]);
      const [interdictionPoints, setInterdictionPoints] = useState<number[]>([]);

      useEffect(() => {
         const element = document.createElement('canvas');
         const context = element.getContext("2d");
         if (!context) {
             return;
         }
         context.font = Constants.WORLD_RADIUS + "px " + Constants.COORDS_FONT_FAMILY;
         const size = context.measureText(props.production.toString());
        setProdTextWidth(size["width"]);
        setBlockadePoints([
               props.x-Constants.WORLD_RADIUS * COS45 - Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 - Constants.WORLD_RADIUS * SIN45 - Constants.PROHIBITION_LINE_OFFSET,
               props.x+Constants.WORLD_RADIUS * COS45 + Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 +Constants.WORLD_RADIUS * SIN45 + Constants.PROHIBITION_LINE_OFFSET
        ]);
        setInterdictionPoints([
               props.x+Constants.WORLD_RADIUS * COS45 + Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 -Constants.WORLD_RADIUS * SIN45 - Constants.PROHIBITION_LINE_OFFSET,
               props.x-Constants.WORLD_RADIUS * COS45 - Constants.PROHIBITION_LINE_OFFSET,
               props.y-Constants.WORLD_RADIUS/2 + Constants.WORLD_RADIUS * SIN45 + Constants.PROHIBITION_LINE_OFFSET
        ]);
      }, [props.x, props.y, props.production]);

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
                      strokeWidth={4}
                      listening={false}
                />}
          {props.prohibition === Constants.PROHIBITION_TYPE.Interdicted &&
                <Line points={interdictionPoints}
                      stroke={Constants.PROHIBITION_COLOR}
                      shadowEnabled={false}
                      strokeWidth={4}
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
          text={props.production.toString()} fontSize={Constants.WORLD_RADIUS} fontFamily={Constants.COORDS_FONT_FAMILY}
         />
       </Group>
    );
}