import {useState, useEffect} from 'react';
import { Group, Rect } from 'react-konva';
import * as Constants from '../../Constants';

export default function ShipDots({x, y, unidentifiedShips, shipDotColors}: {x: number; y: number; unidentifiedShips: boolean; shipDotColors: string[]}) {

    const [shipDots, setShipDots] = useState<any[]>([]);

    const buildShipDots = () => {
        var dots = [];
        var key = 0;
        var rect;

        if (unidentifiedShips) {
            rect = <Rect
                        key={key}
                        x={x - Constants.RADIUS/2 + key * Constants.SHIP_DOT_SIZE}
                        y={y + Constants.RADIUS/3}
                        width={Constants.SHIP_DOT_SIZE}
                        height={Constants.SHIP_DOT_SIZE}
                        fill={Constants.UNIDENTIFIED_SHIPS_COLOR}
                        listening={false}
                    />
            dots.push(rect);
            key++;
        }

        for (var i in shipDotColors) {
            rect = <Rect
                        key={key}
                        x={x - Constants.RADIUS/2 + key * Constants.SHIP_DOT_SIZE + key}
                        y={y + Constants.RADIUS/3}
                        width={Constants.SHIP_DOT_SIZE}
                        height={Constants.SHIP_DOT_SIZE}
                        fill={shipDotColors[i]}
                        listening={false}
                    />
            dots.push(rect);
            key++;
        }
        setShipDots(dots);
    }

    useEffect(() => buildShipDots(), [unidentifiedShips, shipDotColors]);

    if (shipDots.length < 1) {
        return;
    }

   return (
          <Group listening={false}>
            {shipDots}
          </Group>
         );
}