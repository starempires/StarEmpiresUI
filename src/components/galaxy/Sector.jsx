import { useMemo } from 'react';
import { Group } from 'react-konva';
import Coords from './Coords.jsx';
import World from './World.jsx';
import Portal from './Portal.jsx';
import Border from './Border.jsx';
import Hex from './Hex.jsx';
import ShipDots from './ShipDots.jsx';
import * as Constants from '../../Constants.jsx';
import {buildSectorText} from '../common/SectorTextBuilder.jsx';

// interface SectorProps {
//   turnData: TurnData;
//   oblique: number;
//   y: number;
//   onClick: (e: Konva.KonvaEventObject<MouseEvent>, sector: SectorData) => void;
//   onContextMenu: (e: Konva.KonvaEventObject<MouseEvent>, sector: SectorData) => void;
//   onMouseEnter: (x: number, y: number, label: string, text: string) => void;
//   onMouseLeave: () => void;
//   onMouseMove: (x: number, y: number) => void;
// }

export default function Sector(props) {
      const {
        turnData,
        oblique,
        y,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        onClick,
        onContextMenu
      } = props;

    const {
      scanColor,
      coordsText,
      borderType,
      coordsColor,
      world,
      portals,
      shipDotColors,
      xpos,
      ypos,
      sectorData,
      hoverText,
      unidentifiedShips,
      worldColor,
      prohibition
    } = useMemo(() => {
      const [xpos, ypos] = Constants.coordsToPosition(turnData.radius, oblique, y);
      const sectorKey = Constants.getCoordinateKey(oblique, y);
      let sectorData = turnData.sectors[sectorKey];
      if (!sectorData) {
          sectorData = { status: 'unknown', oblique, y };
      }
      const scanColor = Constants.SECTOR_STATUS_COLOR_MAP.get(sectorData.status);
      const coordsText = `${sectorData.oblique},${sectorData.y}`;
      const coordsColor = Constants.COORDS_STATUS_COLOR_MAP.get(sectorData.status);

      let borderType = Constants.BORDER_TYPE.Regular;
      if (sectorData.storms) {
          borderType = Constants.BORDER_TYPE.Nebula;
          if (sectorData.storms.find(storm => storm.rating > 0)) {
              borderType = Constants.BORDER_TYPE.Storm;
          }
      }

    let worldColor;
    let prohibition;
    const world = sectorData.world;
    if (world) {
      if (world.owner) {
        worldColor = turnData.colors[world.owner];
        prohibition = world.prohibition;
      } else {
        worldColor = turnData.colors['unowned'];
      }
    }

     const portals = sectorData.portals;

     var shipDotColors;
     if (sectorData.ships) {
         var empiresPresent = Object.keys(sectorData.ships);
         shipDotColors = empiresPresent.map((e) => turnData.colors[e]);
     }

     const hoverText = buildSectorText(turnData, sectorData);
     const unidentifiedShips = sectorData.unidentifiedShipCount || 0;

    return {
      scanColor,
      coordsText,
      borderType,
      coordsColor,
      world,
      portals,
      shipDotColors,
      xpos,
      ypos,
      sectorData,
      hoverText,
      unidentifiedShips,
      worldColor,
      prohibition
    };
  }, [turnData, oblique, y]);

  const collapsed = portals && (portals.length > 1 || portals[0]?.collapsed);

    return (
      <Group
        onClick={(e) => onClick(e, sectorData)}
        onContextMenu={(e) => onContextMenu(e, sectorData)}
        onMouseEnter={(e) => {
          const mousePosition = e.target.getStage().getPointerPosition();
          onMouseEnter(mousePosition.x, mousePosition.y, coordsText, hoverText);
        }}
        onMouseMove={(e) => {
          const mousePosition = e.target.getStage().getPointerPosition();
//               console.log("sector mouse move " + mousePosition.x + "," + mousePosition.y);

          onMouseMove(mousePosition.x, mousePosition.y);
        }}
        onMouseLeave={onMouseLeave}
      >
        <Hex color={scanColor} x={xpos} y={ypos} />
        <Coords x={xpos} y={ypos} text={coordsText} color={coordsColor} />
        {world && (
          <World
            x={xpos}
            y={ypos}
            color={worldColor}
            production={world.production}
            prohibition={prohibition}
            border={world.homeworld}
          />
        )}
        {portals && <Portal x={xpos} y={ypos} collapsed={collapsed} />}
        <ShipDots
          x={xpos}
          y={ypos}
          unidentifiedShips={unidentifiedShips}
          shipDotColors={shipDotColors}
        />
        <Border x={xpos} y={ypos} type={borderType} />
      </Group>
    );
}