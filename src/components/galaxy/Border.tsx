import { RegularPolygon } from 'react-konva';
import * as Constants from '../../Constants';
import { BorderType } from '../../Constants';

export default function Border({x, y, type} : {x:number; y: number; type: BorderType}) {
       return (
          <RegularPolygon
              x={x}
              y={y}
              sides={6}
              radius={type !== Constants.BORDER_TYPE.Regular ? Constants.RADIUS -1 : Constants.RADIUS}
              rotation={30}
              listening={false}
              stroke={Constants.BORDER_TYPE_COLOR_MAP.get(type)}
              strokeWidth={type !== Constants.BORDER_TYPE.Regular ? 2 : 1}
          />
    );
}